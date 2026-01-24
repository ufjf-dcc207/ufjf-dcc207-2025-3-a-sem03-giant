import { useRef, useEffect } from "react";
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
}: PlayerProps) {
    const groupRef = useRef<Group>(null);

    const targetX = gridPosition[0];
    const targetZ = gridPosition[1];
    const targetY = blockHeight * 0.5;

    const targetRotationY = rotationIndex * (Math.PI / 2);

    useEffect(() => {
        if (groupRef.current) {
            const currentPos = groupRef.current.position;
            const dist = new Vector3(targetX, targetY, targetZ).distanceTo(currentPos);

            // Teleporte se estiver muito longe (reset de fase)
            if (dist > 2) {
                groupRef.current.position.set(targetX, targetY, targetZ);
                groupRef.current.rotation.y = targetRotationY;
            }
        }
    }, [targetX, targetY, targetZ, targetRotationY]);

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        const speed = 15 * delta;

        // Posição (Lerp simples)
        groupRef.current.position.x = MathUtils.lerp(groupRef.current.position.x, targetX, speed);
        groupRef.current.position.z = MathUtils.lerp(groupRef.current.position.z, targetZ, speed);
        groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, targetY, speed);

        const currentRot = groupRef.current.rotation.y;

        // Calcula a diferença entre onde quero ir e onde estou
        let diff = targetRotationY - currentRot;

        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        groupRef.current.rotation.y += diff * speed;
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
