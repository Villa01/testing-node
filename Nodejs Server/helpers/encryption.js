const bcryptjs = require('bcryptjs');

const encrypt = (word) => {
    const salt = bcryptjs.genSaltSync();
    return bcryptjs.hashSync(word, salt);
}

const compareEncrypted = (str1, str2) => {
    return bcryptjs.compareSync(str1, str2);
}

module.exports = {
    encrypt,
    compareEncrypted
}