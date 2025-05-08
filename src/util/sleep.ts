export async function sleep(ticks: number = 1) { 
    return await new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve()
        }, ticks)
    })
}