const fs = require('fs');
const path = 'Z:/FAHHHH/src/components/RoomView.tsx';
let content = fs.readFileSync(path, 'utf8');

function replaceOne(find, replace) {
  if (!content.includes(find)) {
    throw new Error('Snippet not found');
  }
  content = content.replace(find, replace);
}

replaceOne(
`    if (activeInteraction) {
      clearPlayerInteraction(resolveInteractionExitPosition(activeInteraction), {
        type: "move",
        position: nextTarget
      });
      return;
    }
`,
`    if (activeInteraction) {
      clearPlayerInteraction(resolveInteractionExitPosition(activeInteraction));
      return;
    }
`
);

replaceOne(
`    if (activeInteraction?.furnitureId === furnitureId) {
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
`,
`    if (activeInteraction?.furnitureId === furnitureId) {
      clearPlayerInteraction(resolveInteractionExitPosition(activeInteraction));
      return;
    }

    if (
      activeInteraction?.type === "sit" &&
      nextInteractionTarget.type === "use_pc" &&
      activeInteraction.furnitureId === nextInteractionTarget.chairFurnitureId
    ) {
      setQueuedPostInteractionAction(null);
      setPendingInteraction(null);
      setActiveInteraction(nextInteractionTarget);
      setTargetPosition(nextInteractionTarget.position);
      return;
    }

    if (activeInteraction) {
      clearPlayerInteraction(resolveInteractionExitPosition(activeInteraction));
      return;
    }
`
);

fs.writeFileSync(path, content);
