import { ChairModel } from "../ChairModel";
import { FloorLampModel } from "../FloorLampModel";
import { FridgeModel } from "../FridgeModel";
import { OfficeChairModel, OfficeDeskModel, OfficeWardrobeModel } from "../OfficePackModels";
import { PosterModel } from "../PosterModel";
import { SmallTableModel } from "../SmallTableModel";
import {
  BedModel,
  DeskModel,
  RugModel,
  WallFrameModel
} from "../StarterFurnitureModels";
import { BookStackModel, VaseModel } from "../SurfaceDecorModels";
import { WallWindowModel } from "../WallWindowModel";
import { getFurnitureDefinition } from "../../lib/furnitureRegistry";
import type { RoomFurniturePlacement } from "../../lib/roomState";

type FurnitureVisualProps = {
  item: RoomFurniturePlacement;
  shadowsEnabled: boolean;
  selected: boolean;
  blocked: boolean;
  hovered?: boolean;
  interactionHovered?: boolean;
  windowSurfaceLightAmount: number;
  nightFactor: number;
};

export function FurnitureVisual({
  item,
  shadowsEnabled,
  selected,
  blocked,
  hovered = false,
  interactionHovered = false,
  windowSurfaceLightAmount,
  nightFactor
}: FurnitureVisualProps) {
  const definition = getFurnitureDefinition(item.type);
  const commonProps = {
    position: [0, 0, 0] as [number, number, number],
    rotationY: 0,
    shadowsEnabled,
    selected,
    hovered,
    interactionHovered,
    blocked
  };

  switch (definition.modelKey) {
    case "bed":
      return <BedModel {...commonProps} />;
    case "desk":
      return <DeskModel {...commonProps} />;
    case "chair":
      return <ChairModel {...commonProps} />;
    case "small_table":
      return <SmallTableModel {...commonProps} />;
    case "fridge":
      return <FridgeModel {...commonProps} />;
    case "wardrobe":
      return <OfficeWardrobeModel {...commonProps} />;
    case "office_desk":
      return <OfficeDeskModel {...commonProps} />;
    case "office_chair":
      return <OfficeChairModel {...commonProps} />;
    case "window":
      return <WallWindowModel {...commonProps} daylightAmount={windowSurfaceLightAmount} />;
    case "vase":
      return <VaseModel {...commonProps} />;
    case "books":
      return <BookStackModel {...commonProps} />;
    case "poster":
      return <PosterModel {...commonProps} />;
    case "wall_frame":
      return <WallFrameModel {...commonProps} />;
    case "rug":
      return <RugModel {...commonProps} />;
    case "floor_lamp":
      return <FloorLampModel {...commonProps} nightFactor={nightFactor} />;
    default:
      return null;
  }
}
