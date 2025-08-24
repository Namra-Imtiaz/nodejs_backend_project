//const asyncHandler=(func)=>{()=>{}}
//const asyncHandler=(func)=>{async ()=>{}}


const asyncHandler=(requestHandler)=>{(req,res,next)=>{  //it is higer order function it accept function as a parameter
    Promise.resolve(requestHandler(req,res,next)).catch((error)=>{
        next(error)
    })
}}

export default asyncHandler