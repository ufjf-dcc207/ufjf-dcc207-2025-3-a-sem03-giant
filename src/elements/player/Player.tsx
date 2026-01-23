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
    // Posição do Grid
    const worldX = gridPosition[0];
    const worldZ = gridPosition[1];
    const worldY = blockHeight * 0.5;

    const rotationY = rotationIndex * (Math.PI / 2);

    return (
        <group position={[worldX, worldY, worldZ]} rotation={[0, rotationY, 0]} scale={scale}>
            <group position={[0, 0.5, 0]}>
                <Cabeca position={[0, 0.85, 0]} />
                <Torso position={[0, 0, 0]} />
                {/* Braço esquerdo */}
                <Braco position={[-0.5, 0.35, 0]} />
                {/* Braço direito */}
                <Braco position={[0.5, 0.35, 0]} />
                {/* Pernas */}
                <Perna position={[-0.18, -0.6, 0]} />
                <Perna position={[0.18, -0.6, 0]} />
            </group>
        </group>
    );
}
