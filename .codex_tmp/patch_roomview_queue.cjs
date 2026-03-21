const fs = require('fs');
const path = 'Z:/FAHHHH/src/components/RoomView.tsx';
let content = fs.readFileSync(path, 'utf8');

function replaceOne(pattern, replacement) {
  const regex = new RegExp(pattern, 's');
  if (!regex.test(content)) {
    throw new Error('Pattern not found: ' + pattern);
  }
  content = content.replace(regex, replacement);
}

replaceOne(
  String.raw`type PlayerInteractionStatus =\s*\| \{\s*phase: "approaching" \| "active";\s*label: string;\s*interactionType: FurnitureInteractionTarget\["type"\];\s*furnitureId: string;\s*\}\s*\| null;\s*`,
  `type PlayerInteractionStatus =
  | {
      phase: "approaching" | "active";
      label: string;
      interactionType: FurnitureInteractionTarget["type"];
      furnitureId: string;
    }
  | null;

type QueuedPostInteractionAction =
  | {
      type: "move";
      position: Vector3Tuple;
    }
  | {
      type: "interact";
      interaction: FurnitureInteractionTarget;
    }
  | null;

`
);

replaceOne(
  String.raw`const \[activeInteraction, setActiveInteraction\] = useState<FurnitureInteractionTarget \| null>\(null\);\s*`,
  `const [activeInteraction, setActiveInteraction] = useState<FurnitureInteractionTarget | null>(null);
  const [queuedPostInteractionAction, setQueuedPostInteractionAction] =
    useState<QueuedPostInteractionAction>(null);
  `
);

replaceOne(
  String.raw`setPendingInteraction\(null\);\r?\n\s*setActiveInteraction\(null\);\r?\n\s*\}, \[initialFurniturePlacements\]\);`,
  `setPendingInteraction(null);
    setActiveInteraction(null);
    setQueuedPostInteractionAction(null);
  }, [initialFurniturePlacements]);`
);

replaceOne(
  String.raw`if \(buildModeEnabled\) \{\r?\n\s*setPendingInteraction\(null\);\r?\n\s*setActiveInteraction\(null\);\r?\n\s*return;`,
  `if (buildModeEnabled) {
      setPendingInteraction(null);
      setActiveInteraction(null);
      setQueuedPostInteractionAction(null);
      return;`
);

replaceOne(
  String.raw`useEffect\(\(\) => \{\s*if \(!pendingInteraction \|\| activeInteraction\) \{\s*return;\s*\}\s*const interactionApproachPosition =\s*pendingInteraction\.approachPosition \?\? pendingInteraction\.position;\s*const distance = Math\.hypot\(\s*playerWorldPosition\[0\] - interactionApproachPosition\[0\],\s*playerWorldPosition\[2\] - interactionApproachPosition\[2\]\s*\);\s*if \(distance > 0\.05\) \{\s*return;\s*\}\s*setTargetPosition\(pendingInteraction\.position\);\s*setActiveInteraction\(pendingInteraction\);\s*setPendingInteraction\(null\);\s*\}, \[activeInteraction, pendingInteraction, playerWorldPosition\]\);`,
  `useEffect(() => {
    if (!pendingInteraction || activeInteraction) {
      return;
    }

    const interactionApproachPosition =
      pendingInteraction.approachPosition ?? pendingInteraction.position;
    const distance = Math.hypot(
      playerWorldPosition[0] - interactionApproachPosition[0],
      playerWorldPosition[2] - interactionApproachPosition[2]
    );

    if (distance > 0.05) {
      return;
    }

    setTargetPosition(pendingInteraction.position);
    setActiveInteraction(pendingInteraction);
    setPendingInteraction(null);
  }, [activeInteraction, pendingInteraction, playerWorldPosition]);

  useEffect(() => {
    if (!queuedPostInteractionAction || activeInteraction || pendingInteraction) {
      return;
    }

    if (queuedPostInteractionAction.type === "move") {
      setTargetPosition(queuedPostInteractionAction.position);
    } else {
      setPendingInteraction(queuedPostInteractionAction.interaction);
      setTargetPosition(
        queuedPostInteractionAction.interaction.approachPosition ??
          queuedPostInteractionAction.interaction.position
      );
    }

    setQueuedPostInteractionAction(null);
  }, [activeInteraction, pendingInteraction, queuedPostInteractionAction]);`
);

replaceOne(
  String.raw`lastProcessedSceneJumpRequestIdRef\.current = sceneJumpRequest\.requestId;\r?\n\s*setPendingInteraction\(null\);\r?\n\s*setActiveInteraction\(null\);\r?\n\s*setTargetPosition\(sceneJumpRequest\.playerPosition\);`,
  `lastProcessedSceneJumpRequestIdRef.current = sceneJumpRequest.requestId;
    setPendingInteraction(null);
    setActiveInteraction(null);
    setQueuedPostInteractionAction(null);
    setTargetPosition(sceneJumpRequest.playerPosition);`
);

replaceOne(
  String.raw`function clearPlayerInteraction\(nextTarget\?: Vector3Tuple\) \{\s*const exitingActiveInteraction = activeInteraction;\s*\s*setPendingInteraction\(null\);\s*setActiveInteraction\(null\);\s*\s*if \(nextTarget\) \{\s*setTargetPosition\(nextTarget\);\s*\s*if \(exitingActiveInteraction\) \{\s*nextTeleportRequestIdRef\.current \+= 1;\s*setPlayerWorldPosition\(nextTarget\);\s*setPlayerTeleportRequest\(\{\s*requestId: nextTeleportRequestIdRef\.current,\s*position: nextTarget\s*\}\);\s*onPlayerPositionChange\(nextTarget\);\s*\}\s*\s*return;\s*\}\s*\s*setTargetPosition\(\[\s*playerWorldPosition\[0\],\s*playerWorldPosition\[1\],\s*playerWorldPosition\[2\]\s*\]\);\s*\}`,
  `function clearPlayerInteraction(
    nextTarget?: Vector3Tuple,
    postExitAction: QueuedPostInteractionAction = null
  ) {
    const exitingActiveInteraction = activeInteraction;

    setPendingInteraction(null);
    setActiveInteraction(null);
    setQueuedPostInteractionAction(postExitAction);

    if (nextTarget) {
      setTargetPosition(nextTarget);

      if (exitingActiveInteraction) {
        nextTeleportRequestIdRef.current += 1;
        setPlayerWorldPosition(nextTarget);
        setPlayerTeleportRequest({
          requestId: nextTeleportRequestIdRef.current,
          position: nextTarget
        });
        onPlayerPositionChange(nextTarget);
      }

      return;
    }

    setTargetPosition([
      playerWorldPosition[0],
      playerWorldPosition[1],
      playerWorldPosition[2]
    ]);
  }`
);

replaceOne(
  String.raw`const nextTarget: Vector3Tuple = \[clampToFloor\(event\.point\.x\), 0, clampToFloor\(event\.point\.z\)\];\s*\s*if \(activeInteraction \|\| pendingInteraction\) \{\s*clearPlayerInteraction\(nextTarget\);\s*return;\s*\}\s*\s*setTargetPosition\(nextTarget\);`,
  `const nextTarget: Vector3Tuple = [clampToFloor(event.point.x), 0, clampToFloor(event.point.z)];

    if (activeInteraction) {
      clearPlayerInteraction(resolveInteractionExitPosition(activeInteraction), {
        type: "move",
        position: nextTarget
      });
      return;
    }

    if (pendingInteraction) {
      clearPlayerInteraction();
      setTargetPosition(nextTarget);
      return;
    }

    setTargetPosition(nextTarget);`
);

replaceOne(
  String.raw`if \(activeInteraction\?\.furnitureId === furnitureId\) \{\s*clearPlayerInteraction\(resolveInteractionExitPosition\(activeInteraction\)\);\s*return;\s*\}\s*\s*const nextInteractionTarget: FurnitureInteractionTarget = \{\s*\.\.\.interactionTarget,\s*approachPosition: resolveInteractionStandPosition\(interactionTarget\)\s*\};\s*\s*setActiveInteraction\(null\);\s*setPendingInteraction\(nextInteractionTarget\);\s*setTargetPosition\(nextInteractionTarget\.approachPosition \?\? nextInteractionTarget\.position\);`,
  `const nextInteractionTarget: FurnitureInteractionTarget = {
      ...interactionTarget,
      approachPosition: resolveInteractionStandPosition(interactionTarget)
    };

    if (activeInteraction?.furnitureId === furnitureId) {
      clearPlayerInteraction(resolveInteractionExitPosition(activeInteraction));
      return;
    }

    if (activeInteraction) {
      clearPlayerInteraction(resolveInteractionExitPosition(activeInteraction), {
        type: "interact",
        interaction: nextInteractionTarget
      });
      return;
    }

    setQueuedPostInteractionAction(null);
    setActiveInteraction(null);
    setPendingInteraction(nextInteractionTarget);
    setTargetPosition(nextInteractionTarget.approachPosition ?? nextInteractionTarget.position);`
);

fs.writeFileSync(path, content);
