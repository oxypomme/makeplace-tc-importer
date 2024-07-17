import z from 'zod';
import { type Dye, dyesMap } from './dyes';

const MakePlaceFixtureValidation = z.object({
  itemId: z.number(),
  name: z.string().optional(),
});

type MakePlaceFixture = z.infer<typeof MakePlaceFixtureValidation>;

const MakePlaceFurnitureValidation = z.object({
  itemId: z.number(),
  name: z.string().optional(),
  properties: z.object({
    material: z.object({
      itemId: z.number(),
    }).optional(),
    color: z.string().optional(),
  }),
});

type MakePlaceFurniture = z.infer<typeof MakePlaceFurnitureValidation>;

export const MakePlaceSchemaValidation = z.object({
  exteriorFixture: z.array(MakePlaceFixtureValidation),
  interiorFixture: z.array(MakePlaceFixtureValidation),

  exteriorFurniture: z.array(MakePlaceFurnitureValidation),
  interiorFurniture: z.array(MakePlaceFurnitureValidation),
});

export type MakePlaceSchema = z.infer<typeof MakePlaceSchemaValidation>;

export const makePlaceSchema = z.object({
  exteriorFixture: z.array(z.object({
    itemId: z.number(),
    name: z.string().optional(),
  })),
  interiorFixture: z.array(z.object({
    itemId: z.number(),
    name: z.string().optional(),
  })),
  exteriorFurniture: z.array(z.object({
    itemId: z.number(),
    name: z.string().optional(),
    properties: z.object({
      material: z.object({
        itemId: z.number(),
      }).optional(),
      color: z.string().optional(),
    }),
  })),
  interiorFurniture: z.array(z.object({
    itemId: z.number(),
    name: z.string().optional(),
    properties: z.object({
      material: z.object({
        itemId: z.number(),
      }).optional(),
      color: z.string().optional(),
    }),
  })),
});

type ParsedItem = {
  id: number;
  name?: string;
};

type ParsedListItem = {
  item: ParsedItem;
  type: 'exterior-furniture' | 'exterior-fixture' | 'interior-furniture' | 'interior-fixture';
  qte: number;
};

type ParsedListDye = {
  item: Dye;
  type: 'dye';
  qte: number;
};

export type ParsedList = (ParsedListItem | ParsedListDye)[];

/**
 * Parse a MakePlace schema into a list of items
 *
 * @param schema The MakePlace schema
 *
 * @returns The list of items
 */
export function parseSchema(schema: MakePlaceSchema) {
  const parsedItems = new Map<number, ParsedListItem>();
  const parsedColors = new Map<string, ParsedListDye>();

  /**
   * Add a dye to the list
   *
   * @param color The hex color from MakePlace
   */
  const addDye = (color: string) => {
    const item = dyesMap.get(`#${color.slice(0, 6)}`);
    if (!item) {
      return;
    }

    const qte = parsedColors.get(color)?.qte || 0;
    parsedColors.set(color, {
      item,
      type: 'dye',
      qte: qte + 1,
    });
  };

  /**
   * Add an item to the list
   *
   * @param param0 The item
   */
  const addItem = ({ itemId, name }: MakePlaceFixture | MakePlaceFurniture, type: ParsedListItem['type']) => {
    const qte = parsedItems.get(itemId)?.qte || 0;

    parsedItems.set(itemId, {
      item: {
        id: itemId,
        name,
      },
      type,
      qte: qte + 1,
    });
  };

  /**
   * Add an fixture to the list
   *
   * @param fixture The fixture
   */
  const addFixtureItem = (fixture: MakePlaceFixture, type: 'exterior-fixture' | 'interior-fixture') => {
    if (!fixture) {
      return;
    }

    if (fixture.itemId) {
      addItem(fixture, type);
    }
  };

  /**
   * Add an furniture to the list
   *
   * @param fixture The furniture
   */
  const addFurnitureItem = (furniture: MakePlaceFurniture, type: 'exterior-furniture' | 'interior-furniture') => {
    if (!furniture) {
      return;
    }

    if (furniture.itemId) {
      addItem(furniture, type);
    }

    if (furniture.properties?.material?.itemId) {
      addItem(furniture.properties.material, type);
    }

    if (furniture.properties?.color) {
      addDye(furniture.properties.color);
    }
  };

  // Parse furniture
  (schema.exteriorFurniture ?? []).forEach((furniture) => { addFurnitureItem(furniture, 'exterior-furniture'); });
  (schema.interiorFurniture ?? []).forEach((furniture) => { addFurnitureItem(furniture, 'interior-furniture'); });

  // Parse fixture
  (schema.exteriorFixture ?? []).forEach((fixture) => { addFixtureItem(fixture, 'exterior-fixture'); });
  (schema.interiorFixture ?? []).forEach((fixture) => { addFixtureItem(fixture, 'interior-fixture'); });

  return {
    items: Array.from(parsedItems.values()),
    dyes: Array.from(parsedColors.values()),
  };
}
