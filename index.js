const express=require('express');   //Pachete necesare functionare server
const path= require("path");
const fs= require('fs');
const sharp=require('sharp');
const sass=require('sass');
const ejs=require('ejs');
const {Client}= require('pg');
const expressLayouts = require('express-ejs-layouts');

obGlobal={
    erori:[],
    obImagini:[],
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup"), 
    optiuniMeniu:[]
}

app=express();   //Initializare aplicatie + setare port
console.log("Directorul curent:",__dirname); //calea completa a directorului in care se afla fisierul curent index.js
console.log("Fisierul curent:",__filename);
console.log("Folder lucru", process.cwd()); // directorul de lucru curent

vectFoldere=["temp", "temp1", "backup", "poze_uploadate"];  // Pct 20
for (let folder of vectFoldere){
    let cale=path.join(__dirname, folder);
    if (!fs.existsSync(cale)){   // Vf daca folderul exista si daca nu exista il creez
        fs.mkdirSync(cale);
    }
}

let caleBackup=path.join(obGlobal.folderBackup, "resurse/css");
if (!fs.existsSync(caleBackup)) {
    fs.mkdirSync(caleBackup,{recursive:true})
}

app.set("view engine", "ejs"); // Pct. 4
app.use("/resurse",express.static(path.join(__dirname,"resurse"))); // pct. 6 - definire rute pentru resurse statice
app.use("/node_modules",express.static(path.join(__dirname,"node_modules")));
app.get("/*",function(req, res,next){
    console.log(req.url);
    console.log(req.url.length);
    next();
});

app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname,"resurse/ico/favicon.ico"))
});  

app.get(["/", "/index", "/home"],function(req, res){
    res.render("pagini/index", {ip:req.ip, imagini: obGlobal.obImagini.imagini});
});

app.get("/istoric",function(req, res){
    res.render("pagini/istoric");
});
 
app.set('views', path.join(__dirname, 'views'));

function initErori(){
    let continut = fs.readFileSync(path.join(__dirname,"resurse","json", "erori.json")).toString("utf8");
    //console.log(continut);
    let obJson=JSON.parse(continut)
    //for (let i=0; i<obJson.info_erori; i++){ obJson.info_erori[i] ...}
    for(let eroare of obJson.info_erori){
        eroare.imagine=obJson.cale_baza+"/"+eroare.imagine;
    }
    obGlobal.erori=obJson
    obJson.eroare_default.imagine=obJson.cale_baza+"/"+obJson.eroare_default.imagine;
}

initErori();

function initImagini(){
    var continut= fs.readFileSync(__dirname+"/resurse/json/galerie.json").toString("utf-8");

    obGlobal.obImagini=JSON.parse(continut);
    let vImagini=obGlobal.obImagini.imagini;

    let caleAbs=path.join(__dirname,obGlobal.obImagini.cale_galerie);
    let caleAbsMediu=path.join(__dirname,obGlobal.obImagini.cale_galerie, "mediu");
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);

    //for (let i=0; i< vErori.length; i++ )
    for (let imag of vImagini){
        [numeFis, ext]=imag.fisier.split(".");
        let caleFisAbs=path.join(caleAbs,imag.fisier);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
        imag.fisier_mediu=path.join("/", obGlobal.obImagini.cale_galerie, "mediu",numeFis+".webp" )
        imag.fisier=path.join("/", obGlobal.obImagini.cale_galerie, imag.fisier )
        //eroare.imagine="/"+obGlobal.obErori.cale_baza+"/"+eroare.imagine;
    }
}
//initImagini();

function afisEroare(res, _indentificator=-1, _titlu, _text, _imagine){
    let vErori=obGlobal.erori.info_erori
    let eroare= vErori.find(function(el){return el.identificator==_indentificator})
    if(eroare){
        let titlu1= _titlu || eroare.titlu;
        let text1= _text || eroare.text;
        let imagine1= _imagine || eroare.imagine;
        if(eroare.status){
            res.status(_indentificator).render("pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1})
        }
        else{
            res.render("pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1})

        }
        

    }
    else{
        let errDefault=obGlobal.erori.eroare_default
        let titlu1= _titlu || errDefault.titlu;
        let text1= _text || errDefault.text;
        let imagine1= _imagine || errDefault.imagine;
        res.render("pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1})

    }

}

app.get("/*.ejs",function(req, res){   //Pct 19
    afisEroare(res, 400);
});

app.get("/*",function(req, res){
    console.log(req.url);
    if(req.url.match(/^\/resurse(\/[a-zA-Z0-9]*)*\/?$/g)){
        afisEroare(res,403);
        return;
    }
    else
    try{
        res.render("pagini"+req.url, function (err, rezultatRandare){
            if(err){
                console.log("Eroare: ", err);
                if (err.message.startsWith("Failed to lookup view")){
                    afisEroare(res, 404);
                }
                else
                    afisEroare(res);
            }
            else{
                res.send(rezultatRandare);
            }
        });
    }
    catch (err){

            console.log("Eroare: ", err);
            if (err.message.startsWith("Cannot find module")){
                console.log("Eroare fisier resursa negasit");
                afisEroare(res, 404);
            }else
                afisEroare(res);
        
    }

    console.log("cerere generala:", req.url);
});

app.listen(8080);
console.log("A pornit aplicatia");