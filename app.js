require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");
const app = express();
const customItems = ["Check It Out Son", "It Works", "It Wooooorks"];

main().catch((err) => console.log(err));

async function main() {
  app.set("view engine", "ejs");
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static("public"));

  await mongoose.connect(process.env.DB_URL);

  const listSchema = new mongoose.Schema({
    task: String,
  });

  const customSchema = new mongoose.Schema({
    name: String,
    list: [String],
  });

  const Task = mongoose.model("Task", listSchema);
  const List = mongoose.model("List", customSchema);

  app.get("/favicon.ico", (req, res) => res.status(204));

  app.get("/", async function (req, res) {
    const container = await Task.find();
    const tasks = container.map((task) => task.task);
    res.render("list", { ListTitle: "ToDo List", newListItems: tasks });
  });

  app.get("/:list", async (req, res) => {
    const customList = _.capitalize(req.params.list);
    const list = await List.findOne({ name: customList });
    if (!list) {
      const newList = new List({
        name: customList,
        list: customItems,
      });
      await newList.save();
      res.redirect("/" + customList);
    } else {
      res.render("list", { ListTitle: list.name, newListItems: list.list });
    }
  });

  app.post("/", async function (req, res) {
    let item = req.body.newItem;
    let title = req.body.list;
    if (title === "ToDo List") {
      const newTask = new Task({ task: item });
      await newTask.save();
      res.redirect("/");
    } else {
      const find = await List.findOne({ name: title });
      const add = find.list;
      add.push(item);
      find.save();
      console.log(add);
      res.redirect("/" + title);
    }
  });

  app.post("/delete", async (req, res) => {
    const deleteIt = req.body.delete;
    let title = req.body.listName;
    if (title === "ToDo List") {
      await Task.deleteOne({ task: deleteIt });
      console.log("One Item Deleted");
      res.redirect("/");
    } else {
      const remove = await List.updateOne(
        { name: title },
        { $pull: { list: deleteIt } }
      );
      res.redirect("/" + title);
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
