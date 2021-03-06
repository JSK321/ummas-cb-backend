const express = require('express');
const router = express.Router();
const db = require('../models');
const jwt = require('jsonwebtoken');

const checkAuthStatus = request => {
    if (!request.headers.authorization) {
        return false
    }
    const token = request.headers.authorization.split(" ")[1]

    const loggedInUser = jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
        if (err) {
            return false
        } else {
            return data
        }
    });
    console.log(loggedInUser)
    return loggedInUser
}

router.get("/", (req, res) => {
    db.Recipes.findAll({
        include: [
            db.Ingredients,
            db.Steps
        ]
    }).then(recipe => {
        res.json(recipe)
    }).catch(err => {
        console.log(err)
        res.status(500).send("Unable to find recipe")
    })
})

router.get("/:id", (req, res) => {
    db.Recipes.findOne({
        where: {
            id: req.params.id
        },
        include: [
            db.Ingredients,
            db.Steps
        ]
    }).then(recipe => {
        res.json(recipe)
    }).catch(err => {
        console.log(err)
        res.status(500).send("Unable to find recipe")
    })
})

router.get("/category/:recipeCategory", (req, res,) => {
    db.Recipes.findAll({
        where: {
            recipeCategory: req.params.recipeCategory
        },
        include: [
            db.Ingredients,
            db.Steps
        ]
    }).then(recipe => {
        res.json(recipe)
    }).catch(err => {
        console.log(err)
        res.status(500).send("Unable to find breakfast recipe")
    })
})

router.post("/", (req, res) => {
    const loggedInUser = checkAuthStatus(req)
    if (!loggedInUser) {
        return res.status(401).send("Please login first")
    }
    db.Recipes.create({
        recipeName: req.body.recipeName,
        recipeCategory: req.body.recipeCategory,
        recipeDescript: req.body.recipeDescript,
        recipeImage: req.body.recipeImage,
        UserId: loggedInUser.id,
        numberOfLikes: 0
    }).then(newRecipe => {
        res.json(newRecipe)
    }).catch(err => {
        console.log(err)
        res.status(500).send("Unable to create new recipe")
    })
})

router.post("/upload", async (req, res) => {
    try {
        const fileStr = req.body.data
        const uploadedImage = await cloudinar.uploader.upload(fileStr, {
            upload_preset: 'ummas_cb'
        })
        console.log(uploadedImage)
        res.json({ msg: "Uploaded!" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

router.put("/:id", (req, res) => {
    const loggedInUser = checkAuthStatus(req)
    if (!loggedInUser) {
        return res.status(401).send("Please login first")
    }
    db.Recipes.findOne({
        where: {
            id: req.params.id
        }
    }).then(foundRecipe => {
        if (loggedInUser.id === foundRecipe.UserId) {
            db.Recipes.update({
                recipeName: req.body.recipeName,
                recipeCategory: req.body.recipeCategory,
                recipeDescript: req.body.recipeDescript,
                recipeImage: req.body.recipeImage
            },
                {
                    where: {
                        id: foundRecipe.id
                    }
                }).then(updatedRecipe => {
                    res.json(updatedRecipe)
                }).catch(err => {
                    console.log(err)
                    res.status(500).send("Unable to find recipe")
                })
        } else {
            return res.status(401).send("Not your recipe!")
        }
    })
})
router.put("/likes/:id", (req, res) => {
    db.Recipes.findOne({
        where: {
            id: req.params.id
        }
    }).then(foundRecipe => {
        db.Recipes.update({
            numberOfLikes: req.body.numberOfLikes
        },
            {
                where: {
                    id: foundRecipe.id
                }
            }).then(updatedRecipe => {
                res.json(updatedRecipe)
            }).catch(err => {
                console.log(err)
                res.status(500).send("Unable to find recipe")
            })

    })
})

router.delete("/:id", (req, res) => {
    const loggedInUser = checkAuthStatus(req)
    if (!loggedInUser) {
        return res.status(401).send("Please login first")
    }
    db.Recipes.findOne({
        where: {
            id: req.params.id
        }
    }).then(foundRecipe => {
        if (loggedInUser.id === foundRecipe.UserId) {
            db.Ingredients.destroy({
                where: {
                    RecipeId: foundRecipe.id
                }
            })
            db.SavedRecipes.destroy({
                where: {
                    recipeId: foundRecipe.id
                }
            })
            db.Steps.destroy({
                where: {
                    RecipeId: foundRecipe.id
                }
            })
            db.Recipes.destroy({
                where: {
                    id: foundRecipe.id
                }
            }).then(removedRecipe => {
                res.json(removedRecipe)
            }).catch(err => {
                console.log(err)
                res.status(500).send("Unable to find recipe")
            })
        } else {
            return res.status(401).send("Not your recipe!")
        }
    })
})

module.exports = router