const jwt = require('jsonwebtoken');
const express = require('express');
const dotenv = require('dotenv');
const router = express.Router();
const bcrypt = require('bcryptjs');
const authenticate = require('../middleware/authenticate');

require('../db/conn');
const User = require('../model/userSchema');
const Transaction = require('../model/transactionSchema');
const Query = require('../model/querySchema');

router.get('/', (req, res) => {
  res.send(`Hello world from the server router js`);
});

// ...

// Save account number and pin
router.post('/save-account-info', authenticate, async (req, res) => {
  try {
    const { accountNo, pin } = req.body;
    const user = req.rootUser;

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    User.findOne({ accountno: accountNo })
      .then((userExist) => {
        if (userExist) {
          return res.status(422).json({ error: "Account No. already exists" });
        }

        user.accountno = accountNo;
        user.pin = pin;

        user.save().then(() => {
          res.status(201).json({ message: 'Account number and pin saved successfully' });
        }).catch((err) => { console.log(err); return res.status(500).json({ error: "Something went wrong" }) });

      }).catch(err => { console.log(err); });

  }
  catch {
    console.log(err);
    res.status(500).json({ error: 'Internal server error' });
  }


});

// ...

router.post('/transaction', authenticate, async (req, res) => {
  try {
    const { accountno, pin, amount, receiverAccountNumber } = req.body;
    const sender = req.rootUser;
    console.log(sender)
    if (!sender) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Verify PIN
    const isMatch = await bcrypt.compare(pin.toString(), sender.pin.toString());
    console.log(isMatch);
    console.log(pin.toString())
    console.log(sender.pin.toString())
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid PIN' });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const receiver = await User.findOne({ accountno: receiverAccountNumber });

    if (!receiver) {
      return res.status(400).json({ error: 'Receiver not found' });
    }

    // Deduct amount from sender's account
    sender.balance -= amount;

    // Add amount to receiver's account
    receiver.balance += amount;

    await Promise.all([sender.save(), receiver.save()]);

    // Save transaction details
    const transaction = new Transaction({
      senderName: sender.name,
      receiverName: receiver.name,
      senderAcountno: sender.accountno,
      receiverAcountno: receiver.accountno,
      amountTransferred: amount
    });
    await transaction.save();

    res.status(200).json({ message: 'Transaction completed successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});





// API to find transactions for the current user
router.get('/findTransaction', authenticate, async (req, res) => {
  try {
    const accountno = req.rootUser.accountno;

    // Find transactions where senderAcountno or receiverAcountno matches the current user's accountno
    const transactions = await Transaction.find({
      $or: [
        { senderAcountno: accountno },
        { receiverAcountno: accountno }
      ]
    });

    res.status(200).json(transactions);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});







// using promises  

router.post('/register', (req, res) => {
  let token;

  const { name, email, phone, password, cpassword } = req.body;

  if (!name || !email || !phone || !password || !cpassword) {
    return res.status(422).json({ error: "Plz filled the field properly" });
  }

  User.findOne({ email: email })
    .then((userExist) => {
      if (userExist) {
        return res.status(422).json({ error: "Email already Exists" });
      }

      const user = new User({ name, email, phone, password, cpassword });
      

      
  
      user.save().then( async () => {
        token = await user.generateAuthToken();
        res.cookie("jwtoken", token, {
          expires: new Date(Date.now() + 25892000000),  //one month
          httpOnly: true
        });
        
        
        res.status(201).json({ message: "user registered successfuly", token: token  });

      }).catch((err) => { console.log(err); return res.status(500).json({ error: "error" }) });

    }).catch(err => { console.log(err); });

    

});

// login route 

router.post('/signin', async (req, res) => {
  try {
    let token;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Plz Filled the data" })
    }

    const userLogin = await User.findOne({ email: email });

    // console.log(userLogin);

    if (userLogin) {
      const isMatch = await bcrypt.compare(password, userLogin.password);

  

      if (!isMatch) {
        res.status(400).json({ error: "Invalid Credientials " });
      } else {
        // need to genereate the token and stored cookie after the password match 
        token = await userLogin.generateAuthToken();

        res.cookie("jwtoken", token, {
          expires: new Date(Date.now() + 25892000000),  //one month
          httpOnly: true
        });

        res.json({ message: "user Signin Successfully", token: token });
      }
    } else {
      res.status(400).json({ error: "Invalid Credientials " });
    }

  } catch (err) {
    console.log(err);
  }
});


// about us page 

router.get('/about', authenticate, (req, res) => {
  console.log(`Hello my About`);
  res.send(req.rootUser);
});



// get user data for contact us and home page 
router.get('/getdata', authenticate, (req, res) => {
  console.log(`Hello my About`);
  res.send(req.rootUser);
});



// contact us page 

router.post('/contact', authenticate, async (req, res) => {
  try {

    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      console.log("error in contact form");
      return res.json({ error: "plzz filled the contact form " });
    }

    const userContact = await User.findOne({ _id: req.userID });

    if (userContact) {

      const userMessage = await userContact.addMessage(name, email, phone, message);

      await userContact.save();

      res.status(201).json({ message: "user Contact successfully" });

    }

  } catch (error) {
    console.log(error);
  }

});

// Logout  page 
router.get('/logout', (req, res) => {
  console.log(`Hello my Logout Page`);
  res.clearCookie('jwtoken', { path: '/' });
  res.status(200).send('User logout');
});

//get all queries
router.get('/query', async (req, res) => {

  Query.find({}).populate("author", "name").populate({ path: 'comments', populate: { path: 'author', select: "name" } })
    .then(async (queries) => {
      if (!queries) {
        return res.status(401).json({ "status": "No Queries Found !!" });
      }
      return res.status(200).json(queries);
    }).catch((err) => {
      console.log(err);
      return res.status(401).json({ error: err });
    })
});

//get all queries
router.get("/query/:qid", async (req, res) => {
  Query.findById(req.params.qid).populate("author", "name").populate({ path: 'comments', populate: { path: 'author', select: "name" } })
    .then(async (queries) => {
      if (!queries) {
        return res.status(401).json({ "status": "No Queries Found !!" });
      }

      return res.status(200).json(queries);
    }).catch((err) => {
      return res.status(401).json({ error: err });
    })

});

//create a new query
router.post("/query", authenticate, async (req, res) => {

  //console.log(req.rootUser);
  console.log(req.rootUser.name);

  if (!req.body.title || !req.body.desc || !req.rootUser) {
    res.status(400).json({ error: "Please fill the Requied details" });
    return;
  }

  const userId = await User.findOne({ _id: req.userID });

  // var newquery = new Query({
  //   title: req.body.title,
  //   desc: req.body.desc,
  //   author: req.user._id,
  // });

  var newquery = new Query({
    title: req.body.title,
    desc: req.body.desc,
    author: userId,
  });

  if (req.body.tag) {
    newquery.tag = req.body.tag;
  }

  try {
    await newquery.save();
    res.status(200).json({ "status": "Query Created !!", "query": newquery });
    return;
  }
  catch (err) {
    res.status(500).json({ error: err });
    return;
  }

});

//update query
router.put("/query/:qid", authenticate, (req, res) => {
  Query.findOne({ author: req.rootUser._id, _id: req.params.qid })
    .then(async (query) => {
      if (!query) {
        res.status(401).json({ error: "Query not found" });
        return;
      }
  
      if (req.body.title)
        query.title = req.body.title;
      if (req.body.desc)
        query.desc = req.body.desc;

      try {
        await query.save();
        res.status(200).json({ "status": "Query Updated !!", "query": query });
        return;
      }
      catch (err) {
        res.status(500).json({ error: err });
        return;
      }
    })
});

//deleting a query
router.delete("/query/:qid", authenticate, (req, res) => {
  Query.findOne({ author: req.rootUser._id, _id: req.params.qid })
    .then(async (query) => {
      if (!query) {
        res.status(401).json({ error: "Query not found" });
        return;
      }

      try {
        await query.delete();
        console.log(query);
        res.status(200).json({ status: "Deleted !!", query: query });
        return;
      }
      catch (err) {
        res.status(500).json({ error: err });
        return;
      }
    })
});

//post a comment on a query (:qid)
router.post("/comment/:qid", authenticate, (req, res) => {
  Query.findOne({ _id: req.params.qid })
    .then(async (query) => {
      if (!query) {
        res.status(401).json({ error: "Cannot post comment. Query not found." });
        return;
      }

      var comment = {
        desc: req.body.desc,
        author: req.rootUser._id
      }

      query.comments.push(comment);

      try {
        await query.save();
        res.status(200).json({ status: "Comment Saved!!", "query": query });
        return;
      }
      catch (err) {
        res.status(500).json({ error: err });
        return;
      }
    })
});

//resolve a query
router.get("/resolvequery/:qid", authenticate, (req, res) => {

  Query.findOne({ author: req.rootUser._id, _id: req.params.qid })
    .then(async (query) => {
      if (!query) {
        res.status(401).json({ error: "Query not found" });
        return;
      }

      query.isResolved = true;

      try {
        await query.save();
        res.status(200).json({ status: "Query Resolved !!", "query": query });
        return;
      }
      catch (err) {
        res.status(500).json({ error: err });
        return;
      }
    })
});

//vote a comment on a query (:qid) comment(:cid)
//vote flag is passed in body => true upvote & viceversa
//it votes as well as upadates the vote in case same user is trying again
router.post("/votecomment/:qid/:cid", authenticate, async (req, res) => {
  try {
    await Query.findOne({ _id: req.params.qid })
      .then(async (query) => {
        if (!query) {
          res.status(401).json({ error: "Cannot vote comment. Query not found." });
          return;
        }

        if (!query.comments || !query.comments.some((comment) => comment._id == req.params.cid)) {
          res.status(401).json({ error: "Cannot vote comment. Comment not found." });
          return;
        }

        query.comments.map((comment) => {
          if (comment._id == req.params.cid) {

            if (!comment.votes) {

              var vote = {
                user: req.rootUser._id,
                vote: req.body.vote
              }
              comment.votes.push(vote);
              query.save();
              return res.status(200).json({ "status": "Comment Voted!!", "query": query });
            }

            else if (!comment.votes.some((vote) => JSON.stringify(vote.user) == JSON.stringify(req.rootUser._id))) {

              var vote = {
                user: req.rootUser._id,
                vote: req.body.vote
              }
              comment.votes.push(vote);
              query.save();
              return res.status(200).json({ "status": "Comment Voted!!", "query": query });
            }

            else {
              comment.votes.map((vote) => {
                if (JSON.stringify(vote.user) == JSON.stringify(req.rootUser._id)) {
                  vote.vote = req.body.vote;
                }
              })
              query.save();
              return res.status(200).json({ "status": "Vote Updated", "query": query });
            }
          }
        })
      })
  }
  catch (err) {
    return res.status(500).json({ error: err });

  }
});

//update a comment(:cid) on a query (:qid) 
router.put("/updatecomment/:qid/:cid", authenticate, async (req, res) => {
  try {
    await Query.findOne({ _id: req.params.qid })
      .then(async (query) => {

        if (!query) {
          res.status(401).json({ error: "Cannot update comment. Query not found." });
          return;
        }

        if (query.comments.some((comment) => comment._id == req.params.cid)) {
          var flag = false;
          query.comments.map((comment) => {

            if (comment._id == req.params.cid && JSON.stringify(comment.author) == JSON.stringify(req.rootUser._id)) {
              flag = true;
              comment.desc = req.body.desc;
              query.save();
              return res.status(200).json({ status: "Comment updated !!", query: query });

            }
          })
          if (flag == false)
            return res.status(401).json({ error: "you are not authorized to update this Comment !!" });

        }
        else {
          return res.status(401).json({ error: "No such comment found !!" });

        }
      })
  }
  catch (err) {
    return res.status(500).json({ error: err });

  }
});

//delete a comment(:cid) on a query (:qid) 
router.delete("/deletecomment/:qid/:cid", authenticate, async (req, res) => {

  try {
    await Query.findOne({ _id: req.params.qid })
      .then(async (query) => {

        if (!query) {
          res.status(401).json({ error: "Cannot delete comment. Query not found." });
          return;
        }

        if (query.comments.some((comment) => comment._id == req.params.cid)) {
          var flag = false;
          query.comments.map((comment) => {

            if (comment._id == req.params.cid && JSON.stringify(comment.author) == JSON.stringify(req.rootUser._id)) {
              flag = true;
              query.comments.pull({ _id: comment._id });
              query.save();
              return res.status(200).json({ status: "Comment deleted !!" });

            }
          })
          if (flag == false)
            return res.status(401).json({ error: "you are not authorized to delete this Comment !!" });

        }
        else {
          return res.status(401).json({ error: "No such comment found !!" });

        }
      })
  }
  catch (err) {
    return res.status(500).json({ error: err });

  }
});


module.exports = router;