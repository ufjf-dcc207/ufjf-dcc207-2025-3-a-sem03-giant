import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils, Vector3 } from "three";
import Braco from "./Braco";
import Cabeca from "./Cabeca";
import Perna from "./Perna";
import Torso from "./Torso";
import type { PlayerProps } from "./types";

export default function Player({
    scale = 0.5,
    gridPosition,
    rotationIndex,
    blockHeight = 0,
    stepIndex = 0,
    command = "",
}: PlayerProps) {
    const groupRef = useRef<Group>(null);

    const [isHopping, setIsHopping] = useState(false);
    const hopProgress = useRef(0);

    const targetX = gridPosition[0];
    const targetZ = gridPosition[1];
    const targetY = blockHeight * 0.5;
    const targetRotationY = rotationIndex * (Math.PI / 2);

    useEffect(() => {
        if (stepIndex > 0) {
            if (command === "b") {
                setIsHopping(true);
                hopProgress.current = 0;
            }
        }
    }, [stepIndex, command]);

    // Resete de fase
    useEffect(() => {
        if (groupRef.current) {
            const dist = new Vector3(targetX, targetY, targetZ).distanceTo(
                groupRef.current.position,
            );
            if (dist > 2) {
                groupRef.current.position.set(targetX, targetY, targetZ);
                groupRef.current.rotation.y = targetRotationY;
            }
        }
    }, [targetX, targetY, targetZ, targetRotationY]);

    // Loop de animação
    useFrame((_, delta) => {
        if (!groupRef.current) return;

        const current = groupRef.current.position;
        const speed = 15 * delta;

        let hopOffset = 0;
        if (isHopping) {
            hopProgress.current += delta * 12;
            if (hopProgress.current >= Math.PI) {
                setIsHopping(false);
                hopProgress.current = 0;
            } else {
                hopOffset = Math.sin(hopProgress.current) * 0.1;
            }
        }

        let nextX = MathUtils.lerp(current.x, targetX, speed);
        let nextZ = MathUtils.lerp(current.z, targetZ, speed);
        let nextY = MathUtils.lerp(current.y, targetY, speed);

        const distY = targetY - current.y;

        const distXZ = Math.hypot(targetX - current.x, targetZ - current.z);

        if (distY > 0.1) {
            if (Math.abs(distY) > 0.05) {
                nextX = current.x; // Trava X
                nextZ = current.z; // Trava Z
            }
        } else if (distY < -0.1) {
            if (distXZ > 0.05) {
                nextY = current.y; // Trava Y (flutua)
            }
        }

        // Aplica os valores calculados
        groupRef.current.position.x = nextX;
        groupRef.current.position.z = nextZ;
        groupRef.current.position.y = nextY + hopOffset; // Soma o pulinho na altura final

        //Rotação
        const currentRot = groupRef.current.rotation.y;
        let diff = targetRotationY - currentRot;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        if (Math.abs(diff) < 0.01) {
            groupRef.current.rotation.y = targetRotationY;
        } else {
            groupRef.current.rotation.y += diff * speed;
        }
    });

    return (
        <group ref={groupRef} scale={scale}>
            <group position={[0, 0.5, 0]}>
                <Cabeca position={[0, 0.85, 0]} />
                <Torso position={[0, 0, 0]} />
                <Braco position={[-0.5, 0.35, 0]} />
                <Braco position={[0.5, 0.35, 0]} />
                <Perna position={[-0.18, -0.6, 0]} />
                <Perna position={[0.18, -0.6, 0]} />
            </group>
        </group>
    );
}
