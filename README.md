# GhostKitchen-III
**Team:** Katerina Bosko, Jiayi Li

This is the continuation of our projects ["GhostKitchen"](https://github.com/Jiayi-Emily-Li/GhostKitchen) and ["GhostKitchenII"](https://github.com/k-bosko/GhostKitchen-II) that were implemented with SQLite and MongoDB accordingly.

In this project, we rewrote the queries such that they work with **Redis** database. 

## Project description
In this project, we implement a database for a restaurant chain "Golden triangle" which has 5 locations across several U.S. states. The company wants to try out the new business model - ghost kitchen - meaning that the restaurants can create "virtual brands" without providing in-dining options and customers order the new menu items for takeout, drive-through and delivery only. The advantages of this model is that the restaurants can save costs, experiment with new menus and create in-house analytics.

To create a MongoDB database, we went through the whole database creation cycle:

1. Analyzing business requirements
2. Conceptual modeling
3. Logical modeling using Redis data structures
4. Migrating from SQL format to JSON format 
5. Importing JSON files in Redis
6. Rewriting the queries using Redis commands

**GhostKitchen app**  was implemented using Express framework for Node.js, Redis and Bootstrap.

## Using the app

1) Clone the repo and cd into `GhostKitchen-III/app/` 
2) Install the dependencies

```
npm install
```

3) Start the server

```
npm start
```

4) Point your browser to http://locahost:3000

5) Start Redis server locally 
```
redis-server /usr/local/etc/redis.conf
```

7) Import database into your Redis local instance by running 

```
npm run prepopulate
```
 
