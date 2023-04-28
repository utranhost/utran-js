const utran = require('../lib/utran.js')

// const client =  new utran.Client('ws://127.0.0.1:8080')

// async function main(){
//     await client.start()
//     let res = await client.subscribe('good',(topic,msg)=>{
//         console.log(`${topic}:-->${msg}`)
//     })
//     console.log(res)

//     res = await client.call('add',{args:[1,4]})
//     console.log(res)
//     res = await client.multicall([client.call('addt',{args:[1,0],ignore:true}),client.call('add',{args:[1,1]})])
//     console.log(res)

//     // res = await client.unsubscribe(['good'])
//     // console.log(res)

//     // res =  await client.exit()
//     // console.log(res)
// }

// main()

// const soket = utran.UtSocket('ws://127.0.0.1:8080')
async function main(){
    // try {
    //     const soket = await new utran.UtSocket('ws://127.0.0.1:8080/?Authorization=Basic%20dXRyYW5ob3N0OnV0cmFuaG9zdA==').start()
    //     let res = soket.send({"id": 3, "requestType": "rpc", "methodName": "add", "args": [1, 0], "dicts": {}},1)
    //     // soket.exit()
    //     let s = await res
    //     console.log(s)
    // } catch (error) {
    //     console.log(error)
    // }
    const soket = await new utran.UtSocket('ws://127.0.0.1:8080/?Authorization=Basic%20dXRyYW5ob3N0OnV0cmFuaG9zdA==').start()
    let res = soket.send({"id": 3, "requestType": "rpc", "methodName": "add", "args": [1, 0], "dicts": {}})
    // soket.exit()
    let s = await res
    console.log(s)

    console.log("执行完啦.")
}
main()