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
    const name = uuidv4() + '_' + filename;
    const params = {
        Bucket: credentials.BUCKET_NAME,
        Key: name,
        Body: fileData,
        ACL: 'public-read'
    }
    return new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
            if (err) {
                reject(err)
            }
            resolve({ url: data.Location, nombre: name })
        })
    })

}


const deleteFile = (fileName) => {
    const params = {
        Bucket: credentials.BUCKET_NAME,
        Key: fileName,
    }
    return new Promise((resolve, reject) => {
    
        s3.deleteObject(params, (err) => {
            if (err) {
                reject(err)
            }
            resolve({ msg : 'Eliminador con exito' });
        })

    })
}

module.exports = {
    uploadFile,
    deleteFile
}