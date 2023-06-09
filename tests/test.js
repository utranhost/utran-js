const utran = require('../lib/utran.js')

function range(stop,start=0, step=1) {
    if (stop<start){
        let _start = stop
        stop = start
        start = _start
    }
    const array = [];
    for (let i = start; i < stop; i += step) {
        array.push(i);
    }
    return array;
}



// const client =  new utran.BaseClient('ws://127.0.0.1:8080')

// async function main(){
//     await client.start()
//     let res = await client.subscribe('good',(topic,msg)=>{
//         console.log(`${topic}:-->${msg}`)
//     })

//     console.log(res)

//     res = await client.sendRequest({id:client.genRequestId(),requestType:'rpc',methodName:'add',args:[1,0],dicts:{}})
//     console.log(res)

//     res = await client.sendRequest({id:client.genRequestId(),requestType:'rpc',methodName:'add',args:[2,0],dicts:{}})
//     console.log(res)

//     res = await client.sendRequest({id:client.genRequestId(),requestType:'rpc',methodName:'add',args:[3,0],dicts:{}})
//     console.log(res)

//     res = await client.unsubscribe(['good'])
//     console.log(res)

//     client.exit()
//     // res = await client.multicall([client.call('addt',{args:[1,0],ignore:true}),client.call('add',{args:[1,1]})])
//     // console.log(res)

//     // res = await client.unsubscribe(['good'])
//     // console.log(res)

//     // res =  await client.exit()
//     // console.log(res)
// }

// main()



// # UtSocket
// const soket = utran.UtSocket('ws://127.0.0.1:8080')
// async function main(){
//     // try {
//     //     const soket = await new utran.UtSocket('ws://127.0.0.1:8080/?Authorization=Basic%20dXRyYW5ob3N0OnV0cmFuaG9zdA==').start()
//     //     let res = soket.send({"id": 3, "requestType": "rpc", "methodName": "add", "args": [1, 0], "dicts": {}},1)
//     //     // soket.exit()
//     //     let s = await res
//     //     console.log(s)
//     // } catch (error) {
//     //     console.log(error)
//     // }
//     const soket = await new utran.UtSocket('ws://127.0.0.1:8080/?Authorization=Basic%20dXRyYW5ob3N0OnV0cmFuaG9zdA==').start()
//     let res = soket.send({"id": 3, "requestType": "rpc", "methodName": "add", "args": [1, 0], "dicts": {}})
//     // soket.exit()
//     let s = await res
//     console.log(s)

//     console.log("执行完啦.")
// }
// main()




// const client =  new utran.UtClient('ws://127.0.0.1:8080')

// async function main(){
//     await client.start()
//     let res = await client.subscribe('good',(topic,msg)=>{
//         console.log(`${topic}:-->${msg}`)
//     })

//     console.log(res)

//     res = await client.setOptions({timeout:2}).callByName('add',1,0)
//     console.log(res)

//     res = await client.callByName('add',1,1)
//     console.log(res)

//     res = await client.callByName('add',1,2)
//     console.log(res)


//     res = await client.multicall(...range(10).map((i)=>{
//         return client.callByName('add',0,i)
//     }))
//     console.log('multicall2',res.filter(i=>i.state==0))

//     res = await client.unsubscribe(['good'])
//     console.log(res)

//     // client.exit()
//     // res = await client.multicall([client.call('addt',{args:[1,0],ignore:true}),client.call('add',{args:[1,1]})])
//     // console.log(res)

//     // res = await client.unsubscribe(['good'])
//     // console.log(res)

//     // res =  await client.exit()
//     // console.log(res)
// }

// main()



const client =  new utran.Client('ws://127.0.0.1:8080')

async function main(){
    await client.start()
    let res = await client.subscribe('good',(topic,msg)=>{
        console.log(`${topic}:-->${msg}`)
    })
    console.log(res)

    res = await client.setOptions({timeout:0.5}).callByName('add',1,0)
    console.log(res)

    res = await client.call({timeout:1}).add(1,0)
    console.log(res)

    res = await client.call.add(1,1)
    console.log(res)

    res = await client.call.add(1,2)
    console.log(res)


    res = await client.setOptions({timeout:200,outputResult:false}).multicall(...range(100000).map((i)=>{
        return {methodName:'add',params:[0,i]}
    }))
    console.log('multicall2',res)
    console.log('multicall2',res.length,100000)
    // console.log('multicall_失败的请求的:',res.filter(i=>i.state==0))

    // res = await client.unsubscribe(['good'])
    // console.log(res)

    // client.exit()
    // res = await client.multicall([client.call('addt',{args:[1,0],ignore:true}),client.call('add',{args:[1,1]})])
    // console.log(res)

    // res = await client.unsubscribe(['good'])
    // console.log(res)

    // res =  await client.exit()
    // console.log(res)
}

main()