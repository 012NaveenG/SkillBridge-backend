import mongoose from "mongoose"

export const DB_Connect = async () => {

    try {
      const {connection}  = await mongoose.connect(process.env.MONGO_URI)
      console.log(`Connected to Database :: `,connection.host)
    } catch (error) {
        console.log(`Error to connect DB`, error)
    }

}