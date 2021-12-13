#!/usr/bin/env node

const { createClient } = require("redis");

const { readFileSync } = require("fs");

function readFile(filename) {
  const jsonFile = readFileSync(filename);
  return JSON.parse(jsonFile);
}

const meals = readFile("./db/seed/Meals.json");
const locations = readFile("./db/seed/Locations.json");
const customers = readFile("./db/seed/Customers.json");
const pickup_types = readFile("./db/seed/Pickup_Type.json");
const orders = readFile("./db/seed/Orders.json");

async function prepopulateRedis() {
  let clientRedis;
  try {
    clientRedis = createClient();

    clientRedis.on("error", (err) => console.log("Redis Client Error", err));

    await clientRedis.connect();
    console.log("Redis connected");

    //delete existing db from memory, otherwise will keep counting/adding if rerun the script
    await clientRedis.sendCommand(["FLUSHALL"]);
    let brandsIds = {};
    let mealIDs = [];
    let orderID;

    console.log("parsing meals");
    for (const meal of meals) {
      //problem - sAdd() in NodeJs doesn't want to process duplicated keys, throws WRONGTYPE error
      //this is despite original Redis SADD function works with duplicated keys (it just doesn't add them bc it's a set)
      //solution - first add to javascript dict, then go through it and add to Redis set

      brandsIds[`${meal.brand_id}`] = meal.brand_name;

      //counter for meal ids -> we need new one bc we will be updating/deleting this field
      //and ids from older db might not be sequential
      mealIDs.push(meal.meal_id);

      // await clientRedis.SADD(`brand:${meal.brand_id}:meals`, mealID.toString());
      await clientRedis.SADD(
        `brand:${meal.brand_id}:meals`,
        `${meal.meal_id.toString()}`
      );

      //important - use toString() for integer values, otherwise WRONGTYPE error
      await clientRedis.sendCommand([
        "HSET",
        // `brand:${meal.brand_id.toString()}:meal:${mealID.toString()}`,
        `brand:${meal.brand_id.toString()}:meal:${meal.meal_id.toString()}`,
        "brand_id",
        `${meal.brand_id.toString()}`,
        "brand_name",
        `${meal.brand_name}`,
        "meal_id",
        // mealID.toString(),
        `${meal.meal_id.toString()}`,
        "meal_name",
        `${meal.meal_name}`,
        "meal_desc",
        `${meal.meal_desc}`,
        "calories",
        `${meal.calories.toString()}`,
        "price",
        `${meal.price.toString()}`,
      ]);
    }
    
    await clientRedis.SET("mealCount", Math.max(...mealIDs).toString());

    console.log("parsing brands");

    for (const brId in brandsIds) {
      await clientRedis.SADD("brands", `${brId.toString()}`);

      await clientRedis.sendCommand([
        "HSET",
        `brand:${brId.toString()}`,
        "brand_name",
        brandsIds[brId],
        "brand_id",
        brId.toString(),
      ]);
    }

    console.log("parsing locations");
    for (const location of locations) {
      await clientRedis.sendCommand([
        "SADD",
        "locations",
        `${location.id.toString()}`,
      ]);
      await clientRedis.sendCommand([
        "HSET",
        `location:${location.id.toString()}`,
        "id",
        `${location.id.toString()}`,
        "address",
        `${location.address}`,
        "state",
        `${location.state}`,
        "phone_number",
        `${location.phone_number}`,
      ]);
    }
    console.log("parsing customers");
    for (const customer of customers) {
      await clientRedis.sendCommand([
        "HSET",
        `customer:${customer.id.toString()}`,
        "id",
        `${customer.id}`,
        "first_name",
        `${customer.first_name}`,
        "last_name",
        `${customer.last_name}`,
        "address",
        `${customer.address}`,
        "phone_number",
        `${customer.phone_number}`,
        "age",
        `${customer.age}`,
      ]);
    }

    console.log("parsing pickup types");
    for (const pickup_type of pickup_types) {
      await clientRedis.sendCommand([
        "SADD",
        "pickup_types",
        `${pickup_type.id.toString()}`,
      ]);
      await clientRedis.sendCommand([
        "HSET",
        `pickup_type:${pickup_type.id.toString()}`,
        "id",
        `${pickup_type.id.toString()}`,
        "type",
        `${pickup_type.type}`,
      ]);
    }

    console.log("parsing orders");
    for (const order of orders) {
      orderID = await clientRedis.INCR("orderCount");
      // console.log("order - ", orderID);

      if (order.pickup_time === null) {
        console.log(`got current order for customer #${order.customer_id}`);
        await clientRedis.sendCommand([
          "SADD",
          `orders:customer:${order.customer_id.toString()}:current_orders`,
          `${orderID.toString()}`,
        ]);
        await clientRedis.sendCommand([
          "SADD",
          `orders:current_orders`,
          `${orderID.toString()}`,
        ]);
        await clientRedis.sendCommand([
          "HSET",
          `orders:customer:${order.customer_id.toString()}:current_order:${orderID.toString()}`,
          "id",
          `${orderID.toString()}`,
          "customer_id",
          `${order.customer_id.toString()}`,
          "location_id",
          `${order.location.id.toString()}`,
          "location_address",
          `${order.location.address}`,
          "location_state",
          `${order.location.state}`,
          "location_phone",
          `${order.location.phone_number}`,
          "meal_id",
          `${order.meal_info.id.toString()}`, //TODO is not the same as meal_id above!!! see if I need this information
          "meal_name",
          `${order.meal_info.name}`,
          "meal_desc",
          `${order.meal_info.desc}`,
          "meal_price",
          `${order.meal_info.price}`,
          "order_time",
          `${order.order_time}`,
          "pickup_id",
          `${order.pickup.id.toString()}`,
          "pickup_type",
          `${order.pickup.type}`,
          "pickup_time",
          `${order.pickup_time}`,
          "order_quantity",
          `${order.order_quantity.toString()}`,
        ]);
        await clientRedis.sendCommand([
          "HSET",
          `orders:current_order:${orderID.toString()}`,
          "id",
          `${orderID.toString()}`,
          "customer_id",
          `${order.customer_id.toString()}`,
          "location_id",
          `${order.location.id.toString()}`,
          "location_address",
          `${order.location.address}`,
          "location_state",
          `${order.location.state}`,
          "location_phone",
          `${order.location.phone_number}`,
          "brand_name",
          `${order.meal_info.brand_name}`,
          "meal_id",
          `${order.meal_info.id.toString()}`, //TODO is not the same as meal_id above!!! see if I need this information
          "meal_name",
          `${order.meal_info.name}`,
          "meal_desc",
          `${order.meal_info.desc}`,
          "meal_price",
          `${order.meal_info.price}`,
          "order_time",
          `${order.order_time}`,
          "pickup_id",
          `${order.pickup.id.toString()}`,
          "pickup_type",
          `${order.pickup.type}`,
          "pickup_time",
          `${order.pickup_time}`,
          "order_quantity",
          `${order.order_quantity.toString()}`,
        ]);
      }
    }
  } finally {
    // Ensures that the client will close when you finish/error
    await clientRedis.quit();
  }
}

prepopulateRedis().catch(console.dir);
