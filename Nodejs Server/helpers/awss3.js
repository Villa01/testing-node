const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');




const credentials = {
    ID: process.env.AWS_ID_PASSWORD,
    SECRET: process.env.AWS_PASSWORD,
    BUCKET_NAME: process.env.AWS_S3_NAME
}

const s3 = new AWS.S3({
    accessKeyId: credentials.ID,
    secretAccessKey: credentials.SECRET,
})


const uploadFile = (filename, fileData) => {
    const name = uuidv4() + filename;
    console.log(name);
    const params = {
        Bucket: credentials.BUCKET_NAME,
        Key: name,
        Body: fileData,
        ACL:'public-read'
    }
    return new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
            if (err) {
                reject(err)
            }
            resolve(data.Location)
        })
    })

}


module.exports = {
    uploadFile
}