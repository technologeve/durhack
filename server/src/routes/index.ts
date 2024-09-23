import assert from "node:assert/strict"
import { App } from "@otterhttp/app"
import { ClientError, HttpStatus, ServerError } from "@otterhttp/errors"
import type { UserinfoResponse } from "openid-client"

import { prisma } from "@/database"
import { adaptTokenSetToClient, adaptTokenSetToDatabase } from "@/lib/adapt-token-set"
import { isNetworkError } from "@/lib/is-network-error"
import { keycloakClient } from "@/lib/keycloak-client"
import type { KeycloakUserInfo } from "@/lib/keycloak-client"
import { getSession } from "@/lib/session"
import { methodNotAllowed } from "@/middleware/method-not-allowed"
import { applicationApp } from "@/routes/application"
import { authApp } from "@/routes/auth"
import { profileApp } from "@/routes/profile"
import { userApp } from "@/routes/user"
import type { Request, Response } from "@/types"

export const routesApp = new App<Request, Response>()

routesApp.use(async (request, response, next) => {
  const session = await getSession(request, response)
  if (session.userId == null) return next()
  const user = await prisma.user.findUnique({
    where: { keycloakUserId: session.userId },
    include: { tokenSet: true },
  })

  if (user == null || user.tokenSet == null) {
    session.userId = undefined
    await session.commit()
    return next()
  }

  // if the token set has expired, we try to refresh it
  let tokenSet = adaptTokenSetToClient(user.tokenSet)
  if (tokenSet.expired() && tokenSet.refresh_token != null) {
    try {
      tokenSet = await keycloakClient.refresh(tokenSet.refresh_token)
      await prisma.tokenSet.update({
        where: { userId: user.keycloakUserId },
        data: adaptTokenSetToDatabase(tokenSet),
      })
    } catch (error) {
      if (isNetworkError(error)) {
        throw new ServerError("Encountered network error while attempting to refresh a token set", {
          statusCode: 500,
          exposeMessage: false,
          cause: error,
        })
      }
      assert(error instanceof Error)
      console.error(`Failed to refresh access token for ${tokenSet.claims().email}: ${error.stack}`)
    }
  }

  // if the token set is still expired, the user needs to log in again
  if (tokenSet.expired() || tokenSet.access_token == null) {
    session.userId = undefined
    await session.commit()
    return next()
  }

  // use the token set to get the user profile
  let profile: UserinfoResponse<KeycloakUserInfo> | undefined
  try {
    profile = await keycloakClient.userinfo<KeycloakUserInfo>(tokenSet.access_token)
  } catch (error) {
    if (isNetworkError(error)) {
      throw new ServerError("Encountered network error while attempting to fetch profile info", {
        statusCode: 500,
        exposeMessage: false,
        cause: error,
      })
    }

    assert(error instanceof Error)
    console.error(`Failed to fetch profile info for ${tokenSet.claims().email}: ${error.stack}`)

    // if the access token is rejected, the user needs to log in again
    session.userId = undefined
    await session.commit()
    return next()
  }

  request.userProfile = profile
  request.userTokenSet = tokenSet
  request.user = user
  next()
})

routesApp
  .route("/")
  .all(methodNotAllowed(["GET"]))
  .get((request, response) => {
    response.json({
      status: 200,
      message: "OK",
    })
  })

routesApp.use("/auth", authApp)

routesApp.use((request: Request, response: Response, next: () => void) => {
  if (!request.user) {
    throw new ClientError("", { statusCode: HttpStatus.Unauthorized })
  }

  next()
})
routesApp.use("/user", userApp)
routesApp.use("/application", applicationApp)
routesApp.use("/profile", profileApp)
