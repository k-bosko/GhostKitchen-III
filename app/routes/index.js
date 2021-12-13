const { render } = require("ejs");
let express = require("express");
let router = express.Router();

const myDB = require("../db/myRedisDB.js");

/* Middleware for mock authentication */
router.use("*", async function (req, res, next) {
  // Mock authentication before every request
  req.user = await myDB.getUser(12);
  // console.log("got user", req.user);
  next();
});

router.get("/", async function (req, res, next) {
  res.render("index");
});

/* GET user page. */
router.get("/user", async function (req, res, next) {
  const user = req.user;
  res.render("user", { user: user });
});

/* GET user brands page. */
router.get("/user/brands", async function (req, res, next) {
  console.log("Got GET request for brands");
  const brands = await myDB.getBrands();

  console.log("got brands", brands);

  res.render("brands", { brands: brands });
});

/* GET user menu page. */
router.get("/user/brands/:brandID/menu/", async function (req, res, next) {
  console.log("Got GET request for menu");
  const brand_ID = req.params.brandID;
  console.log(`brandId is ${brand_ID}`);

  const meals = await myDB.getMealsBy(brand_ID);

  console.log("got meals", meals);

  res.render("menu", { meals: meals, brandID: brand_ID });
});

/* GET order page. */
router.get(
  "/user/brands/:brandID/menu/:mealID/order/",
  async function (req, res, next) {
    console.log("Got GET order request");

    console.log(`meal_id is ${req.params.mealID}`);
    console.log(`user_id is ${req.user.id}`);

    const brandID = req.params.brandID;
    const mealID = req.params.mealID;
    const meal = await myDB.getMeal(brandID, mealID);

    const pickups = await myDB.getPickupTypes();
    const locations = await myDB.getLocations();

    console.log("got meal", meal);
    console.log("got pickups", pickups);
    console.log("got locations", locations);
    //render the order template with the meal attribute (created by getMeal)
    res.render("order", {
      meal: meal,
      pickups: pickups,
      locations: locations,
      brandID: brandID,
    });
    //^ var to be used in order.ejs
  }
);

/* POST order page. */
router.post(
  "/user/brands/:brandID/menu/order/create/",
  async function (req, res, next) {
    console.log("Got POST to create order");
    const userID = req.user.id;
    const orderQuantity = req.body.quantity;
    const pickupID = parseInt(req.body.pickup_id);
    const locationID = parseInt(req.body.location_id);
    const mealID = req.body.meal_id;
    const brandID = req.params.brandID;

    const currentPickup = await myDB.getPickupType(pickupID);
    const currentLocation = await myDB.getLocation(locationID);
    const currentMeal = await myDB.getMeal(brandID, mealID);

    console.log("got order quantity", orderQuantity);
    console.log("got pickup", currentPickup);
    console.log("got location", currentLocation);
    console.log("got meal", currentMeal);

    await myDB.createOrder(
      orderQuantity,
      currentPickup,
      currentLocation,
      currentMeal,
      userID
    );
    console.log("Order created");

    res.redirect("/user/confirmation/");
  }
);

/* GET confirmation page. */
router.get("/user/confirmation/", async function (req, res, next) {
  res.render("confirmation");
});

/* GET orders page. */
router.get("/user/orders/", async function (req, res, next) {
  console.log("Got GET orders request");
  const userId = req.user.id;
  const orders = await myDB.getOrdersBy(userId);
  console.log("got orders", orders);

  res.render("currentOrders", { orders: orders });
});

/* GET update order page. */
router.get("/user/orders/:orderID/", async function (req, res, next) {
  console.log("Got GET order update request");

  const orderID = req.params.orderID;

  console.log("got order details", orderID);

  const orderDetails = await myDB.getOrder(req.user.id, orderID);
  const pickups = await myDB.getPickupTypes();

  console.log("order details", orderDetails);
  res.render("orderUpdate", {
    orderDetails: orderDetails,
    pickups: pickups,
  });
});

/* POST update order page. */
router.post("/user/orders/update/", async function (req, res, next) {
  if (req.body.orderID === "delete") {
    next();
    return;
  }
  console.log(`Got POST order update request - ${req.body.orderID}`);
  // console.log(req.body);

  const orderID = req.body.orderID;
  const quantity = parseInt(req.body.quantity);
  const pickupID = parseInt(req.body.pickupID);

  console.log("current orderID:", orderID);
  console.log("current quantity:", quantity);
  console.log("current pickupID:", pickupID);

  const currentPickup = await myDB.getPickupType(pickupID);
  await myDB.updateOrder(req.user.id, orderID, quantity, currentPickup);

  console.log("Order updated");
  res.redirect("/user/orders/");
});

/* POST delete order. */
router.post("/user/orders/delete/", async function (req, res, next) {
  console.log("Got post delete order");

  const orderID = req.body.orderID;

  console.log("got delete order", orderID);

  await myDB.deleteOrder(req.user.id, orderID);

  console.log("Order deleted");

  res.redirect("/user/orders/");
});

/* ------Jiayi----- */
/* GET admin page. */
router.get("/admin", async function (req, res, next) {
  res.render("admin");
});

/* GET admin (orders) page. */
router.get("/admin/orders", async function (req, res, next) {
  console.log("GOT get request for order page");
  const orders = await myDB.getAllCurrentOrders();
  console.log("got orders", orders);
  res.render("adminOrders", { orders: orders });
});

/* POST admin (orders) page. */
router.post("/admin/orders/update", async function (req, res, next) {
  console.log("GOT post request for update pickup time");
  const orderID = req.body.orderID;
  console.log(orderID);
  await myDB.updatePickupTime(orderID);
  await myDB.deleteCurrentOrder(orderID);
  console.log("pickup time updated");
  res.redirect("/admin/orders");
});

/* GET Admin (brands) page. */
router.get("/admin/brands", async function (req, res, next) {
  console.log("Got GET request for brands");

  const brands = await myDB.getBrands();

  console.log("got brands", brands);

  //render the _adminBrands_ template with the brands attribute as brands (from DB)
  res.render("adminBrands", { brands: brands });
});

/*GET Admin (meals) page. */
router.get("/admin/brands/:brandID/meals/", async function (req, res, next) {
  //params come with GET, brandID is in params
  console.log("Got request for meals page.");
  console.log(req.params);
  const brandID = req.params.brandID;
  console.log(`brandId is ${brandID}`);

  const meals = await myDB.getMealsBy(brandID);
  const brands = await myDB.getBrand(brandID);
  console.log(brands);
  //render the _adminMeals_ template with the meals attribute as meals (from DB)
  res.render("adminMeals", { meals: meals, brands: brands });
});

/*POST create meals. */
router.post("/admin/meals/create", async function (req, res, next) {
  console.log("Got post create/meal");
  console.log(req.body);
  const meal = req.body;
  const brand_name = req.body.brand_name;
  const brandID = req.body.brandID;
  console.log(`expect${brandID}`);
  console.log("got create meal", meal);

  await myDB.createMeal(meal, brand_name, brandID);

  console.log("Meal created");

  res.redirect(`/admin/brands/${brandID}/meals`);
});

/* POST delete meal. */
router.post("/admin/meals/delete", async function (req, res) {
  console.log("Got post delete meal");

  const brandIDtoDelete = req.body.brandID;
  const mealIDtoDelete = req.body.mealID;

  console.log(`will delete brandID: ${brandIDtoDelete}`);
  console.log(`will delete mealID: ${mealIDtoDelete}`);

  await myDB.deleteMeal(brandIDtoDelete, mealIDtoDelete);

  console.log("Meal deleted");

  res.redirect(`/admin/brands/${brandIDtoDelete}/meals`);
});

// /* GET update adminMeals page. */
// router.get(
//   "/admin/brands/:brandID/meals/:mealID",
//   async function (req, res, next) {
//     console.log("Got adminMeals update");

//     const mealID = req.params.mealID;
//     const brandID = req.params.brandID;

//     console.log("got meal details", mealID);
//     console.log(req.body);
//     console.log("got brandID", brandID);
//     const mealDetails = await myDB.getMealByMealID(mealID);

//     console.log("meal details", mealDetails);
//     res.render("mealUpdate", {
//       mealDetails: mealDetails,
//       brandID: brandID,
//     });
//   }
// );

// /* POST update adminMeals page. */
// router.post("/admin/meals/update/", async function (req, res, next) {
//   console.log("got update POST request");
//   console.log(req.body);

//   const mealID = req.body.mealID;

//   const brandID = req.body.brandID;
//   const meal_name = req.body.meal_name;
//   const meal_desc = req.body.description;
//   const calories = req.body.calories;
//   const price = req.body.price;
//   console.log(meal_desc);

//   await myDB.updateMeal(mealID, brandID, meal_name, meal_desc, calories, price);

//   console.log(`Meal updated`);
//   res.redirect(`/admin/brands/${brandID}/meals`);
// });
// // /* -------Jiayi-------*/

module.exports = router;
