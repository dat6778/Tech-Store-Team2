import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["vn"]; // Chỉ sử dụng Việt Nam

  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          {
            currency_code: "vnd",
            is_default: true,
          },
          {
            currency_code: "usd",
          },
        ],
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });
  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Vietnam",
          currency_code: "vnd",
          countries: ["vn"],
          payment_providers: ["manual"], // Có thể thay bằng MoMo, VNPay sau khi tích hợp
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Hanoi Warehouse",
          address: {
            city: "Hanoi",
            country_code: "VN",
            address_1: "123 Nguyen Trai, Thanh Xuan",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Default Shipping Profile",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Vietnam Delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Vietnam",
        geo_zones: [
          {
            country_code: "vn",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Giao hàng trong 3-5 ngày.",
          code: "standard",
        },
        prices: [
          {
            currency_code: "vnd",
            amount: 30000, // 30,000 VND cho vận chuyển tiêu chuẩn
          },
          {
            region_id: region.id,
            amount: 30000,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Express Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Giao hàng trong 24 giờ.",
          code: "express",
        },
        prices: [
          {
            currency_code: "vnd",
            amount: 50000, // 50,000 VND cho vận chuyển nhanh
          },
          {
            region_id: region.id,
            amount: 50000,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding publishable API key data...");
  const { result: publishableApiKeyResult } = await createApiKeysWorkflow(
    container
  ).run({
    input: {
      api_keys: [
        {
          title: "Tech Store",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });
  const publishableApiKey = publishableApiKeyResult[0];

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product data...");

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Laptops",
          is_active: true,
        },
        {
          name: "Phones",
          is_active: true,
        },
        {
          name: "Tablets",
          is_active: true,
        },
        {
          name: "Accessories",
          is_active: true,
        },
      ],
    },
  });

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "MacBook Pro 14-inch",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Laptops")!.id,
          ],
          description:
            "MacBook Pro 14-inch với chip M2 Pro, 16GB RAM, 512GB SSD, màn hình Retina.",
          handle: "macbook-pro-14",
          weight: 1600,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://example.com/macbook-pro-14-front.jpg",
            },
            {
              url: "https://example.com/macbook-pro-14-side.jpg",
            },
          ],
          options: [
            {
              title: "Color",
              values: ["Space Gray", "Silver"],
            },
          ],
          variants: [
            {
              title: "Space Gray",
              sku: "MBP14-SG",
              options: {
                Color: "Space Gray",
              },
              prices: [
                {
                  amount: 45000000, // 45,000,000 VND
                  currency_code: "vnd",
                },
                {
                  amount: 2000, // 2,000 USD
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "Silver",
              sku: "MBP14-SL",
              options: {
                Color: "Silver",
              },
              prices: [
                {
                  amount: 45000000, // 45,000,000 VND
                  currency_code: "vnd",
                },
                {
                  amount: 2000, // 2,000 USD
                  currency_code: "usd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "iPhone 14 Pro",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Phones")!.id,
          ],
          description:
            "iPhone 14 Pro với chip A16 Bionic, màn hình Super Retina XDR, 128GB bộ nhớ.",
          handle: "iphone-14-pro",
          weight: 206,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://example.com/iphone-14-pro-front.jpg",
            },
            {
              url: "https://example.com/iphone-14-pro-back.jpg",
            },
          ],
          options: [
            {
              title: "Color",
              values: ["Deep Purple", "Space Black"],
            },
          ],
          variants: [
            {
              title: "Deep Purple",
              sku: "IP14P-DP",
              options: {
                Color: "Deep Purple",
              },
              prices: [
                {
                  amount: 25000000, // 25,000,000 VND
                  currency_code: "vnd",
                },
                {
                  amount: 1100, // 1,100 USD
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "Space Black",
              sku: "IP14P-SB",
              options: {
                Color: "Space Black",
              },
              prices: [
                {
                  amount: 25000000, // 25,000,000 VND
                  currency_code: "vnd",
                },
                {
                  amount: 1100, // 1,100 USD
                  currency_code: "usd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "iPad Air 5",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Tablets")!.id,
          ],
          description:
            "iPad Air 5 với chip M1, màn hình Liquid Retina 10.9 inch, 64GB bộ nhớ.",
          handle: "ipad-air-5",
          weight: 461,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://example.com/ipad-air-5-front.jpg",
            },
            {
              url: "https://example.com/ipad-air-5-back.jpg",
            },
          ],
          options: [
            {
              title: "Color",
              values: ["Blue", "Starlight"],
            },
          ],
          variants: [
            {
              title: "Blue",
              sku: "IPA5-BL",
              options: {
                Color: "Blue",
              },
              prices: [
                {
                  amount: 15000000, // 15,000,000 VND
                  currency_code: "vnd",
                },
                {
                  amount: 650, // 650 USD
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "Starlight",
              sku: "IPA5-ST",
              options: {
                Color: "Starlight",
              },
              prices: [
                {
                  amount: 15000000, // 15,000,000 VND
                  currency_code: "vnd",
                },
                {
                  amount: 650, // 650 USD
                  currency_code: "usd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "AirPods Pro 2",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Accessories")!.id,
          ],
          description:
            "AirPods Pro 2 với tính năng chống ồn chủ động, chip H2, thời lượng pin 6 giờ.",
          handle: "airpods-pro-2",
          weight: 50,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://example.com/airpods-pro-2-front.jpg",
            },
            {
              url: "https://example.com/airpods-pro-2-case.jpg",
            },
          ],
          options: [
            {
              title: "Color",
              values: ["White"],
            },
          ],
          variants: [
            {
              title: "White",
              sku: "APP2-WH",
              options: {
                Color: "White",
              },
              prices: [
                {
                  amount: 6000000, // 6,000,000 VND
                  currency_code: "vnd",
                },
                {
                  amount: 250, // 250 USD
                  currency_code: "usd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels.");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const inventoryLevels: CreateInventoryLevelInput[] = [];
  for (const inventoryItem of inventoryItems) {
    const inventoryLevel = {
      location_id: stockLocation.id,
      stocked_quantity: 1000, // Giảm số lượng tồn kho để thực tế hơn
      inventory_item_id: inventoryItem.id,
    };
    inventoryLevels.push(inventoryLevel);
  }

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryLevels,
    },
  });

  logger.info("Finished seeding inventory levels data.");
}