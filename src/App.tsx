import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Floor from "./elements/Floor";
import Player from "./elements/player/Player";
import CommandTape from "./elements/CommandTape";
import VictoryModal from "./elements/VictoryModal";
import { stagesList } from "./elements/Stages";
import type { Stage } from "./elements/Types";
import "./App.css";

export default function App() {
    // --- ESTADOS ---
    const [activeStage, setActiveStage] = useState<Stage>(stagesList[0]);
    const [activeButtons, setActiveButtons] = useState<string[]>([]);

    const [playerGridPos, setPlayerGridPos] = useState<[number, number]>(
        stagesList[0].playerPosition
    );
    const [playerRotation, setPlayerRotation] = useState<number>(0);

    const [isVictory, setIsVictory] = useState(false); // Estado de vitória

    // Inicialização da altura
    const [currentBlockHeight, setCurrentBlockHeight] = useState(() => {
        const heightMatrix = parseGridToHeights(stagesList[0].floor);
        const [x, z] = stagesList[0].playerPosition;
        const h = getBlockHeight(x, z, heightMatrix);
        return h === -1 ? 0 : h;
    });

    const [commands, setCommands] = useState("");
    const [commandIndex, setCommandIndex] = useState(0);
    const [isExecuting, setIsExecuting] = useState(false);

    const resetToStart = (stage: Stage, newCommands: string = "") => {
        setIsVictory(false);

        // Define a fase e comandos
        setActiveStage(stage);
        setCommands(newCommands);

        // Reseta o jogo
        setPlayerGridPos(stage.playerPosition);
        setPlayerRotation(0);
        setActiveButtons([]);
        setCommandIndex(0); // Volta fita para o início

        // Recalcula altura
        const heightMatrix = parseGridToHeights(stage.floor);
        const [x, z] = stage.playerPosition;
        const h = getBlockHeight(x, z, heightMatrix);
        setCurrentBlockHeight(h === -1 ? 0 : h);
    };

    // Quando o usuário DIGITA algo novo
    const handleCommandsUpdate = (val: string) => {
        resetToStart(activeStage, val);
    };

    // Quando o usuário TROCA de fase
    const handleChangeStage = (stage: Stage) => {
        resetToStart(stage, "");
    };

    // Quando o usuário clica no botão RESET
    const handleManualReset = () => {
        resetToStart(activeStage, "");
    };

    const handleRetry = () => {
        // Chama o reset passando a fase atual E os comandos atuais
        resetToStart(activeStage, commands);
    };

    const handleNextStage = () => {
        const currentIndex = stagesList.findIndex((s) => s.id === activeStage.id);
        const nextStage = stagesList[currentIndex + 1];

        if (nextStage) {
            handleChangeStage(nextStage);
        } else {
            handleChangeStage(stagesList[0]);
        }
    };

    const executeStep = async () => {
        if (isExecuting) return;
        if (commandIndex >= commands.length) return;

        setIsExecuting(true);

        const char = commands[commandIndex].toLowerCase();
        const heightMatrix = parseGridToHeights(activeStage.floor);

        let currX = playerGridPos[0];
        let currZ = playerGridPos[1];
        let currRot = playerRotation;
        let currH = currentBlockHeight;

        let currActiveButtons = [...activeButtons];

        // Lógica de Alvo
        let targetX = currX;
        let targetZ = currZ;

        if (currRot === 0) targetZ += 1;
        else if (currRot === 1) targetX += 1;
        else if (currRot === 2) targetZ -= 1;
        else if (currRot === 3) targetX -= 1;

        const targetH = getBlockHeight(targetX, targetZ, heightMatrix);
        const isTargetValid = targetH !== -1;

        let nextX = currX;
        let nextZ = currZ;
        let nextH = currH;
        let nextRot = currRot;

        switch (char) {
            case "f":
                if (isTargetValid && (targetH === currH || targetH === currH - 1)) {
                    nextX = targetX;
                    nextZ = targetZ;
                    nextH = targetH;
                }
                break;
            case "p":
                if (isTargetValid && targetH === currH + 1) {
                    nextX = targetX;
                    nextZ = targetZ;
                    nextH = targetH;
                }
                break;
            case "t":
                nextRot = (currRot + 2) % 4;
                break;
            case "e":
                nextRot = (currRot + 1) % 4;
                break;
            case "d":
                nextRot = (currRot + 3) % 4;
                break;
            case "b":
                const rawVal = getRawValue(currX, currZ, activeStage.floor);
                const isButton = rawVal > 5 || rawVal === 0;

                if (isButton) {
                    const key = `${currX}-${currZ}`;
                    if (currActiveButtons.includes(key)) {
                        currActiveButtons = currActiveButtons.filter((k) => k !== key);
                    } else {
                        currActiveButtons.push(key);
                    }

                    setActiveButtons([...currActiveButtons]);
                }
                break;
        }

        setPlayerGridPos([nextX, nextZ]);
        setPlayerRotation(nextRot);
        setCurrentBlockHeight(nextH);

        const nextIndex = commandIndex + 1;
        setCommandIndex(nextIndex);

        if (nextIndex === commands.length) {
            const totalButtons = countTotalButtons(activeStage.floor);

            if (totalButtons > 0 && currActiveButtons.length === totalButtons) {
                setIsVictory(true);
            }
        }

        setIsExecuting(false);
    };

    // Cálculo visual do player (Offset)
    const mapRows = activeStage.floor.trim().split("\n");
    const mapWidth = Math.max(...mapRows.map((r) => r.length));
    const mapDepth = mapRows.length;

    const visualPlayerX = playerGridPos[0] - mapWidth / 2 + 0.5;
    const visualPlayerZ = playerGridPos[1] - mapDepth / 2 + 0.5;

    return (
        <div className="main-container">
            <VictoryModal isOpen={isVictory} onNextStage={handleNextStage} />

            <div className="sidebar-container">
                <div className="menu-container">
                    <h2>Selecione a Fase</h2>
                    <div className="button-group">
                        {stagesList.map((stage) => (
                            <button
                                key={stage.id}
                                className={activeStage.id === stage.id ? "active" : ""}
                                onClick={() => handleChangeStage(stage)}
                            >
                                {stage.name}
                            </button>
                        ))}
                    </div>
                </div>

                <CommandTape
                    commands={commands}
                    commandIndex={commandIndex}
                    isExecuting={isExecuting}
                    onInputChange={handleCommandsUpdate} // Passa a função que atualiza E reseta
                    onExecuteStep={executeStep}
                    onReset={handleManualReset}
                    onRetry={handleRetry}
                />
            </div>

            <div className="canvas-frame">
                <Canvas key={activeStage.id} shadows camera={{ position: [8, 8, 8], fov: 50 }}>
                    <ambientLight intensity={0.3} />
                    <directionalLight position={[10, 15, 5]} intensity={1.5} castShadow />
                    <pointLight position={[-10, -5, -10]} intensity={0.2} />

                    <group position={[0, 0, 0]}>
                        <Floor grid={activeStage.floor} activeButtons={activeButtons} />

                        <Player
                            gridPosition={[visualPlayerX, visualPlayerZ]}
                            rotationIndex={playerRotation}
                            blockHeight={currentBlockHeight}
                        />
                    </group>
                    <OrbitControls enablePan={false} enableZoom={false} />
                </Canvas>
            </div>
        </div>
    );
}

// _________________________ Functions__________________________ //
const parseGridToHeights = (gridString: string) => {
    return gridString.split("\n").map((row) =>
        row.split("").map((char) => {
            if (char === " ") return 0;
            let val = parseInt(char);
            if (val > 5) val = val - 5;
            if (val === 0) val = 5;
            return val;
        })
    );
};

const getRawValue = (x: number, z: number, gridString: string) => {
    const rows = gridString.split("\n");
    if (z < 0 || z >= rows.length) return -1;
    const row = rows[z].split("");
    if (x < 0 || x >= row.length) return -1;
    const char = row[x];
    if (char === " ") return 0;
    return parseInt(char);
};

const getBlockHeight = (x: number, z: number, heightMatrix: number[][]) => {
    if (z < 0 || z >= heightMatrix.length) return -1;
    if (x < 0 || x >= heightMatrix[z].length) return -1;
    return heightMatrix[z][x];
};

const countTotalButtons = (gridString: string) => {
    let count = 0;
    const rows = gridString.trim().split("\n");
    rows.forEach((row) => {
        row.split("").forEach((char) => {
            if (char === " ") return;
            const val = parseInt(char);
            // Lógica de botão: 0 ou > 5
            if (val === 0 || val > 5) {
                count++;
            }
        });
    });
    return count;
};
