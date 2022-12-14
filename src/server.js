import express, { json } from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import path from "path";

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.static(path.join(__dirname, "/build")));
app.use(json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true,
    });
    const db = client.db("blog-app");

    await operations(db);
    client.close();
  } catch {
    res.status(500).send({ message: "Error connecting to db", error });
  }
};

app.get("/api/articles/:name", (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

app.post("/api/articles/:name/upvotes", (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: articleInfo.upvotes + 1,
        },
      }
    );
    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.post("/api/articles/:name/add-comment", (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const { username, text } = req.body;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          comments: articleInfo.comments.concat({ username, text }),
        },
      }
    );
    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(8000, () => {
  console.log("Listening on port 8000");
});
