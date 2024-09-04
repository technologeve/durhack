"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import * as React from "react";

export default function Splash() {
    const ref = React.useRef(null);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });
    const springProgress = useSpring(scrollYProgress, { stiffness: 400, damping: 90 });

    const cloud1X = useTransform(springProgress, [0, 1], ["0rem", "200rem"]);
    const cloud1Y = useTransform(scrollYProgress, [0, 1], ["0rem", "0rem"]);
    const cloud2X = useTransform(springProgress, [0, 1], ["0rem", "-200rem"]);
    const cloud2Y = useTransform(scrollYProgress, [0, 1], ["0rem", "0rem"]);
    const cloud3X = useTransform(springProgress, [0, 1], ["0rem", "-300rem"]);
    const cloud3Y = useTransform(scrollYProgress, [0, 1], ["0rem", "0rem"]);

    return (
        <div ref={ref} className="overflow-hidden relative">
            <div id="outer-ring" className="rounded-[50%] absolute h-[94rem] w-[94rem] top-[-35rem]"></div>
            <div id="inner-ring" className="rounded-[50%] absolute h-[56rem] w-[56rem] top-[-16rem]"></div>
            <img src="/assets/icons/moon.png" alt="splash" className="h-[32rem] w-[32rem] top-[-4rem] mx-auto rounded-[50%] transition-all duration-500 hover:transition-all hover:duration-300 absolute" id="moon"/>
        
            <motion.div id="cloud-1" className="absolute right-[-10rem] top-[16rem]" style={{ x: cloud1X, y: cloud1Y }}>
                <img src="/assets/icons/cloud-1.png" alt="cloud" className="" />
            </motion.div>

            <motion.div id="cloud-2" className="absolute left-[-20rem] top-[16rem]" style={{ x: cloud2X, y: cloud2Y }}>
                <img src="/assets/icons/cloud-2.png" alt="cloud" className="" />
            </motion.div>

            <motion.div id="cloud-3" className="absolute left-[-5rem] top-[26rem]" style={{ x: cloud3X, y: cloud3Y }}>
                <img src="/assets/icons/cloud-3.png" alt="cloud" className="" />
            </motion.div>

            <div className="h-[200vh]">
                <div>
                    <h2></h2>
                </div>
            </div>
            <div>
                Test div
            </div>
        </div>
    )
}