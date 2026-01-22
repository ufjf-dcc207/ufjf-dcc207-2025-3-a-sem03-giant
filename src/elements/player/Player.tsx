import { useRef, useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

type PlayerProps = {
    gridPosition: [number, number];
    rotationIndex: number;
    blockHeight: number;
};

export default function Player({ gridPosition, rotationIndex, blockHeight }: PlayerProps) {
    const groupRef = useRef<THREE.Group>(null);

    const modelPath = `${import.meta.env.BASE_URL}/robot.glb`;

    const { scene, animations } = useGLTF(modelPath);
    const { actions } = useAnimations(animations, groupRef);

    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [scene]);

    useEffect(() => {
        const actionNames = Object.keys(actions);

        const idleActionName =
            actionNames.find(
                (name) =>
                    name.toLowerCase().includes("idle") || name.toLowerCase().includes("stop"),
            ) || actionNames[0];

        const action = actions[idleActionName];

        if (action) {
            action.reset().fadeIn(0.5).play();
        }

        return () => {
            action?.fadeOut(0.5);
        };
    }, [actions]);

    const rotationY = (rotationIndex * -Math.PI) / 2;

    return (
        <group
            ref={groupRef}
            dispose={null}
            position={[gridPosition[0], blockHeight + (-1 - blockHeight), gridPosition[1]]}
            rotation={[0, rotationY, 0]}
        >
            <primitive object={scene} scale={0.25} />
        </group>
    );
}

useGLTF.preload(`${import.meta.env.BASE_URL}robot.glb`);
