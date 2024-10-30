import { readFile } from "node:fs/promises"
import path from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { compile } from "handlebars"

import { dirname } from "@/dirname"
import { KeycloakAugmentingTransform } from "@/lib/keycloak-augmenting-transform"
import { MailgunMailer } from "@/lib/mailer"

import { MailingWritable } from "./mailing-writable"
import { generateUserInfo } from "./user-info-async-generator"

const mailer = new MailgunMailer()

const messageTemplateSource = await readFile(path.resolve(dirname, "..", "templates", "upload-cv-reminder.hbs"))
const messageTemplate = compile(messageTemplateSource)

const userInfoReadable = Readable.from(generateUserInfo({}))
const userInfoAugmentingTransform = new KeycloakAugmentingTransform()
const mailingWritable = new MailingWritable(mailer, messageTemplate)

await pipeline(userInfoReadable, userInfoAugmentingTransform, mailingWritable)
const mailedCount = mailingWritable.sentMailCount
console.log(`Sent ${mailedCount} emails`)
