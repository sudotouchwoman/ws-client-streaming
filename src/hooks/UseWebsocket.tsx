import { useEffect, useRef, useState } from "react";

const defaultAddr = "ws://localhost:8080/ws"
const secondInGolang = 1000000000

type WebSocketProps = {
    addr: string
    paused: boolean
    consumer: (message: any) => void
}

type WebSocketRequest = {
    method: 'read' | 'list' | 'discover'
    serial: string
    baudrate: number
    timeout: number
}

const SockRequest = (x: Partial<WebSocketRequest>) => {
    return JSON.stringify({
        method: 'read', timeout: 2 * secondInGolang,
        baudrate: 115200, serial: defaultAddr,
        ...x,
    })
}

// wait for websocket to open in order to send messages
const waitForSocketOpen = async (socket: WebSocket) => {
    return new Promise<void>((resolve) => {
        if (socket.readyState !== socket.OPEN) {
            socket.addEventListener('open', (_) => resolve())
        } else {
            resolve()
        }
    })
}

// hook to 
export default function useWebSocket(props: Partial<WebSocketProps>):
    [boolean, (p: boolean) => void, (r: Partial<WebSocketRequest>) => void] {
    const [isPaused, setPause] = useState(props.paused || false);
    const addr = useRef(props.addr || defaultAddr)
    const ws = useRef(new WebSocket(addr.current))

    useEffect(() => {
        // on each render?
        console.log("useEffect for websocket run")
        
        const wsCurrent = ws.current
        wsCurrent.onopen = () => console.log("ws opened");
        wsCurrent.onclose = () => console.log("ws closed");
        // have to wait for the connection to be
        // established before sending anything
        const sendMessage = async () => {
            await waitForSocketOpen(wsCurrent)
            console.log("sends message");
            wsCurrent.send(SockRequest({ baudrate: 115200 }))
        }
        sendMessage()

        // return closure to clean up
        // resources
        return () => {
            console.log("useEffect closed websocket");
            wsCurrent.close();
        };
    }, []);

    useEffect(() => {
        if (!ws) return console.error("ws is undefined");

        ws.current.onmessage = e => {
            if (isPaused) return;
            // invoke consumer with obtained payload
            props.consumer && props.consumer(e.data)
        };
    }, [isPaused]);

    const sendMessage = async (data: Partial<WebSocketRequest>) => {
        await waitForSocketOpen(ws.current)
        ws.current.send(SockRequest(data))
    }

    return [isPaused, setPause, sendMessage];
}