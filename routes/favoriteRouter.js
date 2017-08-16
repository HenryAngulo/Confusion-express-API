var mongoose = require('mongoose');
var express = require('express');
var Verify = require('./verify');
var bodyParser = require('body-parser');
var Favorite = require('../models/favorites');

var favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.all(Verify.verifyOrdinaryUser)
.get(function(req,res){
    var userId = req.decoded._id;
    Favorite.findOne({"postedBy" : userId})
    .populate('postedBy dishes')
    .exec(function(err,favorite){
        if (err) return next(err);
        res.json(favorite);
    });
})
.post(function(req,res){
    var dishId = req.body._id;
    var userId = req.decoded._id;
    Favorite.findOne({"postedBy" : userId}, function(err,favorite){
        if (err) return next(err);
        // If the users doesn't have any favorites (it's the first time or the list was deleted)
        if(favorite == null){
            var newRecord = {
                postedBy : userId,
                dishes: [dishId]
            };
            Favorite.create(newRecord, function(err, favorite){
                if (err) return next(err);
                res.json(favorite);
            });
        }
        //If the users already added at least one favorite
        else{
            //If the dish that the users are trying to add is not in their favorites
            if(favorite.dishes.indexOf(dishId) < 0){
                favorite.dishes.push(dishId);
                favorite.save(function(err, favorite){
                    if (err) return next(err);
                    res.json(favorite);
                });
            }
            //If the dish that the users are trying to add is already in their favorites
            else{
                res.json({"error": "Dish already in favorites"});
            }
        }
    });
})
.delete(function(req,res){
    var userId = req.decoded._id;
    Favorite.findOneAndRemove({"postedBy" : userId}, function(err,favorite){
        if (err) return next(err);
        res.json(favorite);
    });
});

favoriteRouter.route('/:dishId')
.delete(Verify.verifyOrdinaryUser, function(req,res){
    var userId = req.decoded._id;
    var dishId = req.params.dishId;
    Favorite.findOne({"postedBy" : userId}, function(err,favorite){
        if(favorite.dishes.indexOf(dishId) >= 0){
         favorite.dishes.splice(favorite.dishes.indexOf(dishId),1);   
         favorite.save(function(err, favorite){
            if (err) return next(err);
            res.json(favorite);
         });
        }
        //If the users are trying to delete a dish that's not in their favorites
        //This would be imposible in a client, but in postman technically you could 
        //Try to do it if you forgot that you deleted it and use the same id as before
        //Or send the request with an incorrect or nonexistent id
        else{
            res.json({"error": "No such dish in this user's favorites"});
        }
    })
})

module.exports = favoriteRouter;