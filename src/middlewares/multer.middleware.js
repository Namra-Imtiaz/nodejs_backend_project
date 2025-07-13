import multer from 'multer'

const storage=multer.diskStorage({
    destination:function(req,file,cb){  //req jo user sai arahi ismai to jo bhi body mai json data araha wo mil jata hai
        // file aik aur parameter milta hai jis mai sari files hoti hain that is why we use multer 
        //cb to simple call back hota hai 
        cb(null,'./public/temp') 
        //null means abhi hum koi error handling nahi dai rahai
        //'./public/temp' is the destination jaha tum file ko store karna chahtai ho 
    },
    filename:function(req,file,cb){
        const uniqueSuffix=Date.now()+'-'+Math.round(Math.random()*1E9)  //date.now() ka mtlab hai current time in illiseconds and math.random()*1E9 means aik unique number generate hoga -> 1E9 yaani 1000000000
        cb(null,file.fieldname +'-'+ uniqueSuffix)  //fieldname matlab jo hum html mai daitai hain field ka name
    }
})

export const upload=multer({
    storage:storage      //Ab finally hum multer ka instance bana rahe hain jisme humne upar jo storage banaya hai wo diya gaya.
})