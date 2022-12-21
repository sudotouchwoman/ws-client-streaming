import { Slide, Snackbar } from "@mui/material";
import React, { createContext, useCallback, useEffect, useReducer, useRef, useState } from "react";

export const defaultAddr = "ws://localhost:8080/ws"

export type WebSocketState = {
    ready: boolean
    message: any | null
    ws: WebSocket | null
    toggleOpen: () => void
}

export const WebsocketContext = createContext<WebSocketState>({
    ready: false,
    message: null,
    ws: null,
    toggleOpen: () => { console.warn("nothing to toggle") }
})

export interface WebSocketProviderProps  {
    children: React.ReactNode
    url: string
}

type SockState = {
    message: any
    open: boolean
    ready: boolean
    snackbar: string | null
    ws: WebSocket | null
}

type SockAction = {
    type: 'open' | 'close' | 'error' | 'message' | 'send' | 'close_sb' | 'toggle'
    ws: WebSocket
    message: string
    request: string
}

const WebSocketDispatcher = (s: SockState, a: Partial<SockAction>): SockState => {
    console.log('action:', a.type || 'unknown')
    switch (a.type) {
        case 'toggle':
            return { ...s, open: !s.open, ready: false }
        case 'open':
            if (!a.ws) break
            return { ...s, ready: true, snackbar: "Opened WS", ws: a?.ws }
        case 'error':
            return { ...s, open: false, ready: false, snackbar: "Failed to open", ws: null }
        case 'close':
            return { ...s, open: false, ready: false, snackbar: "Cleaned up connection", ws: null }
        case 'message':
            console.log(a.message ? "message:" + a.message : "empty message!")
            return { ...s, message: a?.message }
        case 'close_sb':
            return { ...s, snackbar: null }
        default:
            break;
    }
    return s
}

export const WebSocketProvider = React.memo((props: WebSocketProviderProps) => {
    const [state, dispatch] = useReducer(WebSocketDispatcher, {
        message: null,
        open: false,
        ready: false,
        snackbar: null,
        ws: null as unknown as WebSocket
    })

    console.info(state)

    // dispatch events associated with websocket
    // register listeners and unregister them on cleanup
    useEffect(() => {
        if (!state.open) return console.log('socket is closed, effect omitted')
        console.log("will open new websocket")
        const socket = new WebSocket(props.url)

        const errorListener = (e: Event) => {
            console.warn("websocket error", e)
            dispatch({ type: 'error' })
        }
        const closeListener = () => {
            console.log('closing ws')
            if (!state.ws) return
            dispatch({ type: 'close' })
        }
        const messageListener = (e: MessageEvent) => {
            console.log("ws message:", e.data)
            dispatch({ type: 'message', message: e.data })
        }
        const openListener = () => {
            console.log('ws opened')
            dispatch({ type: 'open', ws: socket })
        }

        socket.addEventListener('error', errorListener)
        socket.addEventListener('message', messageListener)
        socket.addEventListener('close', closeListener)
        socket.addEventListener('open', openListener)

        return () => {
            console.log('will close current ws')
            if (!state.ws) return console.log('already closed')
            socket.removeEventListener('open', openListener)
            socket.removeEventListener('error', errorListener)
            socket.removeEventListener('message', messageListener)
            socket.removeEventListener('close', closeListener)
            socket.close()
            dispatch({ type: 'close' })
            console.log("closed current ws");
        }
    }, [state.open])

    const toggler = useCallback(
        () => {
            dispatch({ type: 'toggle' })
        },
        [state.ws],
    )
    return (
        // why does snackbar block all the underlying
        // content from re-rendering untill it's closed?
        <>
            <Snackbar
                open={!!state.snackbar}
                message={state.snackbar}
                TransitionComponent={Slide}
                autoHideDuration={5000}
                onClose={(e, reason) => {
                    // if (reason === 'clickaway') return
                    dispatch({ type: 'close_sb' })
                }}
            />
            <WebsocketContext.Provider value={{
                ready: state.open && state.ready,
                message: state.message,
                ws: state.ws,
                toggleOpen: toggler
            }}>
                {props.children}
            </WebsocketContext.Provider>
        </>
    )
})

// OK so basically promise is an awaitable object
// I created the function below while tweaking WebSocket
// callbacks in order not to send messages before
// connection is established
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
