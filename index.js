const { MongoClient ,ServerApiVersion, ObjectId} = require('mongodb');
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors({    
  origin: ['http://localhost:5173'],
  credentials: true
}))
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.waw16py.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,   
    deprecationErrors: true,
  }
});

    app.post('/jwt', async(req, res) => {
          const user = req.body;
          console.log('User For Token',user);
          const token = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET , {expiresIn: '1h'});
          
          res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite:'none'
          })
          .send({success:true})
    })

    app.post('/logout', async(req, res) => {
      const user = req.body;
      console.log('logging out', user);
      res.clearCookie('token', {maxAge: 0, sameSite: 'none', secure: true }).send({success: true})
      })

    const verifyToken = async(req, res, next) => {
            const token = req.cookies?.token;
            if(!token){
              return res.status(401).send({message: 'not authorized'})
            }
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
              if(err){
                console.error(err);
                return res.status(401).send({message: 'unauthorized'})
              }
              console.log('value of the Token', decoded);
              req.user = decoded;
              next()
            })
    }

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const newsCollection = client.db("Blog").collection("News");
    const BookmarkCollection = client.db("Blog").collection("Bookmark");

    //auth related api
    app.post('/jwt', async(req, res) => {
      const user = req.body
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      console.log(token);

      res
      .cookie('token', token, {
          httpOnly: true, 
          secure: false,
          })
      .send({success: true})     
    })
    
    app.get('/news', async(req, res) => {
      const cursor = newsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
 
    app.get('/news/:id', async(req, res) => {
       const id = req.params.id;
       const query = {_id: new ObjectId(id)}
       const options = {
          projection : {title:1 , image:1, category:1 , News_Id:1, description:1}
       }
       const result = await newsCollection.findOne(query, options);
       res.send(result);
    })

    app.post('/addnews', async(req, res) => {
      const news = req.body
      const result = await newsCollection.insertOne(news)
      res.send(result)
    })

    app.put('/news/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const options = {upsert:true};
      const updateNews = req.body;
      const news = {    
        $set : {
          title: updateNews.title,
          category:updateNews.category,
          image:updateNews.image  ,
          description:updateNews.description,
        }
      }
      const result = await newsCollection.updateOne(filter, news, options)
      res.send(result)
    })
    
    app.delete('/news/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await newsCollection.deleteOne(query);
      res.send(result);
    }) 

    //bookmark
    app.get('/bookmark' ,verifyToken, async(req, res) => {
      // console.log('token Is here', req.cookies.token);
      // console.log('user in the valid Token', req.user.email);
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email  }
      }
      // console.log('bookmark');    
      const result = await BookmarkCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/bookmark/:id', async(req, res) => {
       const id = req.params.id;
       const query = {_id: new ObjectId(id)}
       const result = await BookmarkCollection.findOne(query);
       console.log(result);
       res.send(result);
    })
    app.post('/bookmark', async(req, res) => {
      const bookmark = req.body
      console.log(bookmark)
      const result = await BookmarkCollection.insertOne(bookmark)
      res.send(result)
    })
    app.delete('/bookmark/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await BookmarkCollection.deleteOne(query);
      res.send(result);
    }) 

     await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!✅");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res )=> {
    res.send('News blog is running')
})

app.listen(port, () => {
    console.log(`News blog server is running on port ${port}`);
})
