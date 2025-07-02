const groupModel = require("../models/groupModel");
const productModel = require("../models/productModel");

exports.createGroup = async (req, res) => {
  try {
    let exist = await groupModel.findOne({ name: req.body.name });

    if (exist) {
      return res.status(200).send({
        success: false,
        message: "This group is already exist",
      });
    }

    req.body.name = req.body.name.toLowerCase();

    await groupModel(req.body).save();

    exist = await groupModel.findOne({ name: req.body.name });

    let arr = req.body.products;
    arr.forEach(async (p) => {
      await productModel.findByIdAndUpdate(
        p,
        { group: exist._id },
        { new: true }
      );
    });

    res.status(200).send({
      success: true,
      message: "Group created",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    let exist = await groupModel.find({ name: req.body.name });
    const { id } = req.params;

    if (exist.length) {
      exist.forEach((e) => {
        if (
          e.name.toLowerCase() === req.body.name.toLowerCase() &&
          id != e._id
        ) {
          return res.status(200).send({
            success: false,
            message: "Duplicate name",
          });
        }
      });
    }

    const products = await productModel.find({ group: id });

    if (products.length) {
      products.forEach(async (p) => {
        await productModel.findByIdAndUpdate(
          p._id,
          { group: null },
          { new: true }
        );
      });
    }

    await groupModel.findByIdAndUpdate(id, req.body, { new: true });

    exist = await groupModel.findOne({ name: req.body.name });

    let arr = req.body.products;
    arr.forEach(async (p) => {
      await productModel.findByIdAndUpdate(
        p,
        { group: exist._id },
        { new: true }
      );
    });

    res.status(200).send({
      success: true,
      message: "Group created",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await groupModel.findById(id).populate("products");

    if (!group) {
      return res.status(200).send({
        success: false,
        message: "No group found",
      });
    }
    console.log(group?.products);
    const ids = group?.products;

    async function getProducts(ids) {
      let products = [];

      const promises = ids.map(async (element) => {
        let pro = await productModel.findOne({ _id: element }).lean();
        return pro;
      });

      products = await Promise.all(promises);
      return products;
    }

    const products = await getProducts(ids);

    if (!group) {
      return res.status(200).send({
        success: false,
        message: "No group",
      });
    }

    res.status(200).send({
      success: true,
      message: "Getting group products",
      group,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

exports.getGroupByName = async (req, res) => {
  try {
    const { groupName } = req.body;
    if (!groupName) {
      return res.status(200).send({
        success: false,
        message: "No group found",
      });
    }

    const group = await groupModel
      .findOne({ name: groupName.toLowerCase() })
      .populate("products");

    if (!group) {
      return res.status(200).send({
        success: false,
        message: "No group found",
      });
    }
    console.log(groupName);

    res.status(200).send({
      success: true,
      message: "Getting groups",
      group,
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "No group found",
    });
  }
};

exports.getAllGroup = async (req, res) => {
  try {
    console.log("here");
    const groups = await groupModel.find({}).populate("products");

    res.status(200).send({
      success: true,
      message: "Getting groups",
      groups,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    await groupModel.findByIdAndDelete(id);

    res.status(200).send({
      success: true,
      message: "Deleted",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};
