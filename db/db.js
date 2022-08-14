const fs = require("fs-extra");
const fs_old = require("fs");

class JSONdb {
    db_file = "./db.json";
    constructor(jsonfile) {
        this.db_file = jsonfile;
        this.createDBFile();
    }
    createDBFile(){
        if(!fs_old.existsSync(this.db_file)){
            fs.writeJsonSync(this.db_file, "{}")
        }
    }
    getJSON(){
        return fs.readJsonSync(this.db_file);
    }
    set(key, value, update = false){
        const json = this.getJSON();
        if(update){
            json[key] = { ...json[key], ...value};
        }else{
            json[key] = value;
        }
        // console.log("write file", json)
        fs.writeJsonSync(this.db_file, json)
    }

    get(key){
        const json = this.getJSON();
        return json[key];
    }
}

const product_db = new JSONdb("./db/products.json");
const user_db = new JSONdb("./db/users.json");

module.exports = {
    product_db,
    user_db
}
