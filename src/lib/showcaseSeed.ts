import type { PersistedSandboxState } from "./devLocalState";
import type { PersistedWorldSettings } from "./devWorldSettings";

export const SHOWCASE_HUD_DAY_LABEL = "Showcase";

export const SHOWCASE_SANDBOX_SEED: PersistedSandboxState = {
  "version": 6,
  "skinSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAQlBMVEUBAQEvLy8pKSkiIiJwJjpnJC9eIyl1KEJXICAiGxvRf5Bvb29nZmZVVVVLS0tZWVn3vsP639r4zMwAAAAWFhYZGRmzZgq+AAAAAXRSTlMAQObYZgAAAr1JREFUeNrNlouSqyAMhiM3a3e75RLe/1VPQuDgslXrOmfmfGVCQqe/CUYsNLS2xlitb/rmHBkYsIatseCAIDOitbPWka3AgLFVZgvr+MrOkmVucBZDCvR74yoXBDxxVkBKIKgEHwl/oQQfQ4j+fAauZECWBfYycGKG+29cE3BG+kHW2b7Ot/UFCZh5NnMXmDnWBM9socIxVGZjZpmLAKa1QMIfAhkAWLgHXcDMNYN7wTmJjRGBXsBsZwMz9Lgavn4RWJb7fVmKQMIuUC9prQVjeZKFLqCNbOKyLN6TcRL3TYTCspCIzIXVJlpnaTgX7jHeg3MSa11nBwW3NcNNHqJbu/8tHh7r4f4PcUb6ZExQ0UopTQMTJhoIFVmFnyDxSoB/TPR1Ir4pEH0VYLF1BmEQ2CohxFoCC+yWkMvFyTLkaKIJVF8qItuXjgWUflcgYooxRe89IkaMmpkmTNOkq5+Q/ElNU1+CToiB8QVyFJM5qawK7JIvAqrwSiAy7CIjAlj9Em4KlNp6cWpLYHMPns9PGo+vwuP5TAx3D43ql3Azg/JF/2ZqpcReVgmHDLZLkEw4r8+WFfH4ejuD1heyLD6S2RfIeCiw3YmFtmHFQ3kGGPFp4IaAkOnzCqTP/8/1EjINEthTOi8gZ8+61fYFsKbaBbhlWrewS/7bSENJi619+Lco1edf8PEBA3IeiF9crA8dFHafRriOnFPw0X2KTmYw9lM+EgD4K/CtscQ/16EojXXuoRivgBkzHy5Qkdcb7DMIIAsc/S/oDLdPUTxmENRFAbUvwMiOIyq1PpE1owg2GvZoAt77yFwRCEwMAYMITASnpbe3HRqJCSFXkmKagIJjIiMZFDMIHJ8HUjMjlQ97cHwmyBuZ/zPIW/llBi3uZyCjihnjIYNjxhIuZ/CeAMD3H2D+fQmJwVzBdCTwBx3yPhC/MSIOAAAAAElFTkSuQmCC",
  "cameraPosition": [
    18.515595269136632,
    4.279414084397768,
    2.356172248262889
  ],
  "playerPosition": [
    1.7178813496553855,
    0,
    0.8925118100319502
  ],
  "playerCoins": 42,
  "roomState": {
    "metadata": {
      "roomId": "dev-shared-room",
      "roomTheme": "starter-cozy",
      "layoutVersion": 6,
      "unlockedFurniture": [
        "bed",
        "desk",
        "chair",
        "table",
        "fridge",
        "wardrobe",
        "office_desk",
        "office_chair",
        "window",
        "vase",
        "books",
        "poster",
        "wall_frame",
        "rug",
        "floor_lamp"
      ],
      "unlockedThemes": ["starter-cozy"]
    },
    "furniture": [
      {
        "id": "starter-rug",
        "type": "rug",
        "surface": "floor",
        "position": [
          0.90239343789169,
          0,
          -2.0892200149118043
        ],
        "rotationY": 0.04,
        "ownedFurnitureId": "owned-starter-rug"
      },
      {
        "id": "starter-bed",
        "type": "bed",
        "surface": "floor",
        "position": [
          -3.5,
          0,
          -3
        ],
        "rotationY": -3.141592653589793,
        "ownedFurnitureId": "owned-starter-bed"
      },
      {
        "id": "starter-office-desk",
        "type": "office_desk",
        "surface": "floor",
        "position": [
          0.820371944155216,
          0,
          -3.945468746280867
        ],
        "rotationY": 3.141592653589793,
        "ownedFurnitureId": "owned-starter-office-desk"
      },
      {
        "id": "starter-office-chair",
        "type": "office_chair",
        "surface": "floor",
        "position": [
          0.8693564446235946,
          0,
          -2.8945023264269345
        ],
        "rotationY": 3.141592653589793,
        "ownedFurnitureId": "owned-starter-office-chair"
      },
      {
        "id": "starter-wardrobe",
        "type": "wardrobe",
        "surface": "floor",
        "position": [
          3.5,
          0,
          -4.55
        ],
        "rotationY": 0,
        "ownedFurnitureId": "owned-starter-wardrobe"
      },
      {
        "id": "starter-table",
        "type": "table",
        "surface": "floor",
        "position": [
          0.5,
          0,
          4.5
        ],
        "rotationY": 1.5707963267948966,
        "ownedFurnitureId": "owned-starter-table"
      },
      {
        "id": "starter-window-left",
        "type": "window",
        "surface": "wall_left",
        "position": [
          -4.83,
          1.82,
          -3.1837022061818203
        ],
        "rotationY": 1.5707963267948966,
        "ownedFurnitureId": "owned-starter-window-left"
      },
      {
        "id": "starter-window-back-left",
        "type": "window",
        "surface": "wall_right",
        "position": [
          4.83,
          1.82,
          0.44813774408109097
        ],
        "rotationY": -1.5707963267948966,
        "ownedFurnitureId": "owned-starter-window-back-left"
      },
      {
        "id": "starter-window-back-right",
        "type": "window",
        "surface": "wall_back",
        "position": [
          1.05,
          1.82,
          -4.83
        ],
        "rotationY": 0,
        "ownedFurnitureId": "owned-starter-window-back-right"
      },
      {
        "id": "starter-poster",
        "type": "poster",
        "surface": "wall_left",
        "position": [
          -4.83,
          2,
          1.5
        ],
        "rotationY": 1.5707963267948966,
        "ownedFurnitureId": "owned-starter-poster"
      },
      {
        "id": "starter-wall-frame",
        "type": "wall_frame",
        "surface": "wall_left",
        "position": [
          -4.83,
          1.74,
          -0.9
        ],
        "rotationY": 1.5707963267948966,
        "ownedFurnitureId": "owned-starter-wall-frame"
      },
      {
        "id": "ceiling_fan-8d4295e8-a0cc-4fed-b3b2-b74378c7e5b8",
        "type": "ceiling_fan",
        "surface": "ceiling",
        "position": [
          -0.2452523064076786,
          4.220000000000001,
          -3.6
        ],
        "rotationY": 0,
        "ownedFurnitureId": "owned-ceiling_fan-118cab7c-5443-4974-816c-587928948a04"
      },
      {
        "id": "fridge-ff1b2331-8b56-4560-8c9c-7e11d1110bc5",
        "type": "fridge",
        "surface": "floor",
        "position": [
          -4.466339737998025,
          0,
          4.466339737998025
        ],
        "rotationY": 1.64060949687467,
        "ownedFurnitureId": "owned-fridge-70cbb49d-81cd-4e02-88c7-56d207f7b743"
      },
      {
        "id": "window-f42f8575-4e67-476a-bcf7-6df12c59598b",
        "type": "window",
        "surface": "wall_front",
        "position": [
          2.505324662473744,
          1.82,
          4.83
        ],
        "rotationY": 3.141592653589793,
        "ownedFurnitureId": "owned-window-0f2b5339-cdac-43e3-9d3a-efc4bce150e5"
      },
      {
        "id": "window-37cf6630-fe90-4493-8e60-c728c8a06bc8",
        "type": "window",
        "surface": "wall_front",
        "position": [
          -2.5,
          1.82,
          4.83
        ],
        "rotationY": 3.141592653589793,
        "ownedFurnitureId": "owned-window-0f2b5339-cdac-43e3-9d3a-efc4bce150e5"
      },
      {
        "id": "ceiling_light-c5443330-99a5-4f65-bf45-3792f44b311d",
        "type": "ceiling_light",
        "surface": "ceiling",
        "position": [
          -3.843882698558556,
          4.220000000000001,
          -3.311415991795574
        ],
        "rotationY": 0,
        "ownedFurnitureId": "owned-ceiling_light-bc01eb69-7cf7-42bb-b8ff-b627349a0d0a"
      },
      {
        "id": "chair-afe2af08-1f8b-407a-9e87-aa47bb89e2fb",
        "type": "chair",
        "surface": "floor",
        "position": [
          -0.5,
          0,
          4.5
        ],
        "rotationY": 1.570796326794897,
        "ownedFurnitureId": "owned-chair-7bb7b48f-32a5-4c51-8084-dfdb3a465baf"
      },
      {
        "id": "ceiling_fan-2b98ceb8-39d9-4a5d-88e6-bdc5facfa19d",
        "type": "ceiling_fan",
        "surface": "ceiling",
        "position": [
          -0.5,
          4.220000000000001,
          2.5
        ],
        "rotationY": 0,
        "ownedFurnitureId": "owned-ceiling_fan-dc5f7c3f-044f-4daf-9ede-c254460b628c"
      }
    ],
    "ownedFurniture": [
      {
        "id": "owned-starter-rug",
        "type": "rug",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "starter"
      },
      {
        "id": "owned-starter-bed",
        "type": "bed",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "starter"
      },
      {
        "id": "owned-starter-office-desk",
        "type": "office_desk",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "starter"
      },
      {
        "id": "owned-starter-office-chair",
        "type": "office_chair",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "starter"
      },
      {
        "id": "owned-starter-wardrobe",
        "type": "wardrobe",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "starter"
      },
      {
        "id": "owned-starter-table",
        "type": "table",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "starter"
      },
      {
        "id": "owned-starter-books",
        "type": "books",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "starter"
      },
      {
        "id": "owned-starter-vase",
        "type": "vase",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "starter"
      },
      {
        "id": "owned-starter-window-left",
        "type": "window",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "starter"
      },
      {
        "id": "owned-starter-window-back-left",
        "type": "window",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "starter"
      },
      {
        "id": "owned-starter-window-back-right",
        "type": "window",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "starter"
      },
      {
        "id": "owned-starter-poster",
        "type": "poster",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "starter"
      },
      {
        "id": "owned-starter-wall-frame",
        "type": "wall_frame",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "starter"
      },
      {
        "id": "owned-ceiling_light-bc01eb69-7cf7-42bb-b8ff-b627349a0d0a",
        "type": "ceiling_light",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "sandbox_catalog"
      },
      {
        "id": "owned-ceiling_fan-118cab7c-5443-4974-816c-587928948a04",
        "type": "ceiling_fan",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "sandbox_catalog"
      },
      {
        "id": "owned-ceiling_fan-dc5f7c3f-044f-4daf-9ede-c254460b628c",
        "type": "ceiling_fan",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "sandbox_catalog"
      },
      {
        "id": "owned-fridge-70cbb49d-81cd-4e02-88c7-56d207f7b743",
        "type": "fridge",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "sandbox_catalog"
      },
      {
        "id": "owned-window-0f2b5339-cdac-43e3-9d3a-efc4bce150e5",
        "type": "window",
        "ownerId": "shared-room:dev-shared-room",
        "acquiredFrom": "sandbox_catalog"
      },
      {
        "id": "owned-fridge-62477d82-4acf-456c-bd10-4c2bd35b9d3d",
        "type": "fridge",
        "ownerId": "local-player",
        "acquiredFrom": "sandbox_catalog"
      },
      {
        "id": "owned-window-de047e37-cbc5-4ffb-8b95-e88c7a8bcf9d",
        "type": "window",
        "ownerId": "local-player",
        "acquiredFrom": "sandbox_catalog"
      },
      {
        "id": "owned-chair-7bb7b48f-32a5-4c51-8084-dfdb3a465baf",
        "type": "chair",
        "ownerId": "local-player",
        "acquiredFrom": "sandbox_catalog"
      }
    ]
  },
  "pcMinigame": {
    "bestScore": 0,
    "lastScore": 0,
    "gamesPlayed": 0,
    "totalCoinsEarned": 0,
    "lastRewardCoins": 0,
    "lastCompletedAt": null
  },
  "pets": [
    {
      "id": "pet-minecraft_cat-d8b4e015-8193-4ef5-9f88-beb34f7e0a94",
      "type": "minecraft_cat",
      "presetId": "better_cat_tabby_fluffy_tail_orange_eye_grey",
      "acquiredFrom": "pet_shop",
      "spawnPosition": [
        1.9693564446235947,
        0,
        -1.9295023264269344
      ],
      "displayName": "Cat 1",
      "status": "active_room",
      "behaviorProfileId": "curious",
      "care": {
        "hunger": 15,
        "affection": 25,
        "energy": 10,
        "lastUpdatedAt": "2026-03-28T04:07:42.451Z",
        "lastCareActionAt": "2026-03-28T03:52:17.874Z"
      }
    },
    {
      "id": "pet-minecraft_cat-94ffa974-a022-480b-907b-0052100dbbf8",
      "type": "minecraft_cat",
      "presetId": "better_cat_glb",
      "acquiredFrom": "pet_shop",
      "spawnPosition": [
        1.9693564446235947,
        0,
        -1.9295023264269344
      ],
      "displayName": "Cat 2",
      "status": "active_room",
      "behaviorProfileId": "curious",
      "care": {
        "hunger": 0,
        "affection": 0,
        "energy": 0,
        "lastUpdatedAt": "2026-03-28T04:07:42.451Z",
        "lastCareActionAt": "2026-03-28T02:41:13.404Z"
      }
    },
    {
      "id": "pet-minecraft_cat-2b4f15a0-679d-4c82-a29d-4478fbc5c1af",
      "type": "minecraft_cat",
      "presetId": "better_cat_base_body_base_ears_bobtail",
      "acquiredFrom": "pet_shop",
      "spawnPosition": [
        1.9693564446235947,
        0,
        -1.9295023264269344
      ],
      "displayName": "Cat 3",
      "status": "active_room",
      "behaviorProfileId": "curious",
      "care": {
        "hunger": 0,
        "affection": 0,
        "energy": 0,
        "lastUpdatedAt": "2026-03-28T04:07:42.451Z",
        "lastCareActionAt": null
      }
    },
    {
      "id": "pet-minecraft_cat-a497a451-0a1f-4829-91be-da9d6c917c1a",
      "type": "minecraft_cat",
      "presetId": "better_cat_fluffy_body_base_ears_flufftail",
      "acquiredFrom": "pet_shop",
      "spawnPosition": [
        1.9693564446235947,
        0,
        -1.9295023264269344
      ],
      "displayName": "Cat 4",
      "status": "active_room",
      "behaviorProfileId": "curious",
      "care": {
        "hunger": 0,
        "affection": 0,
        "energy": 0,
        "lastUpdatedAt": "2026-03-28T04:07:42.451Z",
        "lastCareActionAt": null
      }
    },
    {
      "id": "pet-minecraft_cat-1ef8968b-903d-44fa-af63-ee642b83b0aa",
      "type": "minecraft_cat",
      "presetId": "better_cat_fluffy_body_big_ears_bobtail",
      "acquiredFrom": "pet_shop",
      "spawnPosition": [
        1.9693564446235947,
        0,
        -1.9295023264269344
      ],
      "displayName": "Cat 5",
      "status": "active_room",
      "behaviorProfileId": "curious",
      "care": {
        "hunger": 0,
        "affection": 0,
        "energy": 0,
        "lastUpdatedAt": "2026-03-28T04:07:42.451Z",
        "lastCareActionAt": "2026-03-28T02:41:19.372Z"
      }
    }
  ]
}
;

export const SHOWCASE_WORLD_SETTINGS_SEED: PersistedWorldSettings = {
  version: 1
};
