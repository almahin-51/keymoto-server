const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const { MongoClient } = require("mongodb");

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nrtib.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("keyeMotor");
    const motorBikesCollection = database.collection("bikes");
    const purchaseData = database.collection("purchase");
    const userCollection = database.collection("users");
    const reviewerCollection = database.collection("reviewer");

    // All products load
    app.get("/motorbikes", async (req, res) => {
      const cursor = await motorBikesCollection.find({}).toArray();
      res.json(cursor);
    });

    // add product to home page
    app.post("/motorbikes", async (req, res) => {
      const data = req.body;
      const result = await motorBikesCollection.insertOne(data);
      res.json(result);
    });

    // Single product load
    app.get("/bikes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cursor = await motorBikesCollection.findOne(query);
      res.json(cursor);
    });

    // Purchase product data to server
    app.post("/purchase", async (req, res) => {
      const purchase = req.body;
      const result = await purchaseData.insertOne(purchase);
      res.json(result);
    });

    // My Orders product show
    app.get("/purchases", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = await purchaseData.find(query).toArray();
      res.json(cursor);
    });

    // Manage all Orders product show
    app.get("/purchases/all", async (req, res) => {
      const cursor = await purchaseData.find({}).toArray();
      res.json(cursor);
    });

    // DELETE AN ORDER PRODUCT
    app.delete("/purchases/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await purchaseData.deleteOne(query);
      res.json(result);
    });

    // Update Status
    app.patch("/purchases", async (req, res) => {
      console.log(req.body);
      const { id, status } = req.body;
      const find = {
        _id: ObjectId(id),
      };
      const product = await purchaseData.findOne(find);
      if (product._id) {
        const filter = {
          _id: ObjectId(product._id),
        };
        const updateDoc = {
          $set: {
            status,
          },
        };

        const options = { upsert: false };
        const result = await purchaseData.updateOne(filter, updateDoc, options);

        res.json(result);
      } else {
        res.status(404).send("Something is wrong!");
      }
    });

    // Add User
    app.post("/users", async (req, res) => {
      const user = req.body;
      const newUser = { user, role: "general" };
      const result = await userCollection.insertOne(user);
      console.log("user connected");
      res.json(result);
    });

    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    //Add Admin
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // find admin
    app.get("/users/admin", async (req, res) => {
      // const email = req.params.email;
      //   const query = { role: "admin" };
      const user = await userCollection.find({}).toArray();
      // let isAdmin = false;
      // if (user?.role === 'admin') {
      //     isAdmin = true;
      // }
      res.json(user);
    });

    // check and make admin
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // delete admin
    app.put("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = { $set: { role: "general" } };
      const result = await userCollection.updateOne(query, updateDoc, options);
      res.json(result);
    });

    // POST review
    app.post("/review", async (req, res) => {
      const data = req.body;
      const result = await reviewerCollection.insertOne(data);
      res.json(result);
    });

    // review show
    app.get("/review", async (req, res) => {
      const cursor = await reviewerCollection.find({}).toArray();
      res.json(cursor);
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("KEYMOTO Server is Running now..!!");
});

app.listen(port, () => {
  console.log(`listening at ${port}`);
});
