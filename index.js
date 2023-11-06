const { MongoClient ,ServerApiVersion, ObjectId} = require('mongodb');
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())
//   {
//   origin: [
//      'http://localhost:5173',
//      'https://assignment-11-3127e.web.app',
//      'https://assignment-11-3127e.firebaseapp.com'
//   ],
//  credentials: true
// }



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.waw16py.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const newsCollection = client.db("Blog").collection("News");
    const BookmarkCollection = client.db("Blog").collection("Bookmark");
       
    
    app.get('/news', async(req, res) => {
      const cursor = newsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })


    app.get('/news/:id', async(req, res) => {
       const id = req.params.id;
       const query = {_id: new ObjectId(id)}
       const result = await newsCollection.findOne(query);
       res.send(result);
    })

    app.post('/addnews', async(req, res) => {
      const news = req.body
      console.log(news)
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

    app.get('/bookmark', async(req, res) => {
      const cursor = BookmarkCollection.find();
      const result = await cursor.toArray();
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
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res )=> {
    res.send('News blog is running')
})

app.listen(port, () => {
    console.log(`News blog server is running on port ${port}`);
})
