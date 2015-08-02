/**
 * Created by thangnv on 8/2/15.
 */
'use strict';
let fs = require('fs');
let cheerio = require('cheerio');
let request = require('request');
let path = require('path');
let folder = __dirname+'/comics/';
//get all link prepare to download
function getLink(url,pattern,isImage,callback){
    //console.log(url);
    request(url, function (req, res, body) {
        let links=[];
        if (res.statusCode == 200) {
            let document = cheerio.load(body);
            //console.log(body);
            document(pattern).map(function (key,val) {
                if(isImage)
                    links.push(document(val).attr('src'));
                else
                    links.push(document(val).attr('href'));
            })
        }else{
            callback([]);
        }
        console.log('getLink done !!'+links);
        if(isImage)
            callback(links);
        else
            callback(links[randomInt(0,links.length)]||[]);
    });
}

function getComic(url,callback){

    getLink(url,'div#mainStory ul.NewsList li a.StoryName',false, function (comicUrl) {
        if(comicUrl.length > 0)
        getLink(comicUrl,'li ul.List li a',false,function(chapterUrl){
            if(comicUrl.length > 0)
            getLink(chapterUrl,'div#contentChapter img',true, function (pagesOfComic) {
                if(pagesOfComic.length > 0){
                    let nameOfComic = comicUrl.split('/').pop();
                    let chapter = chapterUrl.split('-').pop();
                    nameOfComic = nameOfComic.replace(/[\[\+\-\.\,\!\@\#\$\%\^\&\*\(\)\;\\\/\|\<\>\"\'\]]/ig,'_');
                    //check and create folder if not exists
                    if (!fs.existsSync(folder))fs.mkdirSync(folder);
                    if (!fs.existsSync(folder+nameOfComic))fs.mkdirSync(folder+nameOfComic);
                    if (!fs.existsSync(folder+nameOfComic+'/'+chapter))fs.mkdirSync(folder+nameOfComic+'/'+chapter);
                    //console.log(pagesOfComic);
                    pagesOfComic.map(function (url,val) {
                        let ext ;
                        let filename = path.basename(url);
                        if (filename.match(/.jpg/ig)) ext = 'jpg';
                        if (filename.match(/.png/ig)) ext = 'png';
                        filename = folder+nameOfComic+'/'+chapter+'/' + val+'.'+ext;
                        //check file
                        fs.exists( filename, function (exists) {
                            if(!exists) {
                                console.log("Downloading ...");
                                request({
                                    url : url + '?fit=crop&fm='+ext+'&q=50&w=400' ,
                                    encoding: 'binary'}
                                    , function (err,response,body) {
                                                    if(err) {
                                                        callback(err)
                                                    } else {
                                                        fs.writeFile(filename ,body,'binary', function (err) {
                                                            if(err) {
                                                                callback(err);
                                                            }
                                                        })
                                                    }
                                })
                            } else {
                                callback('File Existed');
                            }
                        })
                    });

                }else{
                    callback('Cannot get pages of comic');
                }

            });
            else{
                callback('Cannot get chapters of comic');
            }

        });
        else{
            callback ('Cannot get links of comic');
        }
    });
}
function randomInt(min,max){
    return Math.floor(Math.random()*(max-min))
}


getComic('http://vechai.info',function(err){
    console.log('callback');
    if (err){
        console.log(err);
    }
});