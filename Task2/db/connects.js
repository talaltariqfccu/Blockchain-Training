import mongoose from "mongoose";

async function connectDb(databaseUrl){

     const dbOption = {
        dbname : "MarketPlaceDb"

    }

    await mongoose.connect(databaseUrl, dbOption)
    .then(console.log(`Connection Successfull`))
    .catch((err)=>console.log(err));
}

export default connectDb;