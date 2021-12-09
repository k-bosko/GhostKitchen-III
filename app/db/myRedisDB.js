const { createClient } = require("redis");

async function getConnection() {
  let clientRedis = createClient();
  clientRedis.on("error", (err) => console.log("Redis Client Error", err));
  await clientRedis.connect();

  console.log("Connected to Redis");
  return clientRedis;
}

async function getUser(userId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();

    return await clientRedis.HGETALL(`customer:${userId}`);
  } finally {
    clientRedis.quit();
  }
}

async function getBrand(brandId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    return await clientRedis.HGETALL(`brand:${brandId}`);
  } finally {
    clientRedis.quit();
  }
}

async function getBrands() {
  let clientRedis;
  try {
    clientRedis = await getConnection();

    const brandsId = await clientRedis.SMEMBERS("brands");

    console.log("got brands", brandsId);

    const brandsList = [];
    for (let brId of brandsId) {
      const brand = await getBrand(brId);
      brandsList.push(brand);
    }

    return brandsList;
  } finally {
    clientRedis.quit();
  }
}

async function getMealsBy(brandId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();

    const mealsIds = await clientRedis.SMEMBERS(`brand:${brandId}:meals`);

    console.log("got meals", mealsIds);

    const meals = [];
    for (let mealId of mealsIds) {
      const meal = await getMeal(brandId, mealId);
      meals.push(meal);
    }

    return meals;
  } finally {
    clientRedis.quit();
  }
}

async function getMeal(brandId, mealId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    return await clientRedis.HGETALL(`brand:${brandId}:meal:${mealId}`);
  } finally {
    clientRedis.quit();
  }
}

async function getLocations() {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    const locationsIds = await clientRedis.SMEMBERS("locations");

    console.log("got locations", locationsIds);

    const locationsList = [];
    for (let locId of locationsIds) {
      const loc = await getLocation(locId);
      locationsList.push(loc);
    }

    return locationsList;
  } finally {
    clientRedis.quit();
  }
}

async function getLocation(locId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    return await clientRedis.HGETALL(`location:${locId}`);
  } finally {
    clientRedis.quit();
  }
}

async function getPickupTypes() {
  console.log("DB request for pickup types");
  let clientRedis;
  try {
    clientRedis = await getConnection();
    const pickup_typeIds = await clientRedis.SMEMBERS("pickup_types");

    console.log("got pickup types", pickup_typeIds);

    const pickup_typeList = [];
    for (let typeId of pickup_typeIds) {
      const type = await getPickupType(typeId);
      pickup_typeList.push(type);
    }

    return pickup_typeList;
  } finally {
    clientRedis.quit();
  }
}

async function getPickupType(typeId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    return await clientRedis.HGETALL(`pickup_type:${typeId}`);
  } finally {
    clientRedis.quit();
  }
}
module.exports = {
  getUser,
  getBrand,
  getBrands,
  getMealsBy,
  getMeal,
  getLocations,
  getLocation,
  getPickupType,
  getPickupTypes,
};

//useful documentation
//https://github.com/redis/node-redis
