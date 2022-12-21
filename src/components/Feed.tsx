import { Alert, AlertColor, Button, Card, ListItem, ListItemText, Snackbar, Typography } from '@mui/material'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ReadyState } from 'react-use-websocket'
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import { defaultAddr, WebsocketContext } from '../contexts/UseWebsocket'

const maxEntries = 10
const secondInGolang = 1000000000

type SocketRequest = {
    method: 'read' | 'list' | 'discover'
    serial: string
    baudrate: number
    timeout: number
}

type RedrawProps = {
    name: string
}

export const Redraws = (p: RedrawProps) => {
    const redraws = useRef(0)
    useEffect(() => {
        redraws.current += 1
    })
    return (
        <Typography variant='body1'>
            {p.name} redraws: {redraws.current}
        </Typography>
    )
}

type LogFeedProps = {
    messages: string[]
}

// LogFeed component renders a FixedSizeList
// of elements provided by parent
const LogFeed = (props: LogFeedProps) => {
    const { messages } = props
    const renderRows = (p: ListChildComponentProps<string[]>) => {
        const { index, style, data } = p
        return (
            <ListItem style={style} key={data[index]} component='div'>
                <ListItemText primary={data[index]} />
            </ListItem>
        )
    }
    return (
        <>
            <Redraws name='log-feed' />
            <FixedSizeList
                width={500}
                height={500}
                itemData={messages}
                itemSize={46}
                itemCount={messages.length}
            >
                {renderRows}
            </FixedSizeList>
        </>
    )
}

const SocketNotReady = (r: ReadyState): boolean => {
    return r !== ReadyState.OPEN
}

interface AlertSnackbarProps {
    open: ReadyState
}

// displays an alert once websocket connection is
// closed or reopened
const AlertSnackbar = ({ open }: AlertSnackbarProps) => {
    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[open];

    const severity = (r: ReadyState): AlertColor => {
        if ([ReadyState.CONNECTING, ReadyState.CLOSING].includes(r)) return 'warning'
        if (ReadyState.OPEN === r) return 'success'
        return 'error'
    }

    return <Snackbar
        open={true}
        autoHideDuration={500}
    >
        <Alert severity={severity(open)}>
            Websocket connection status: {connectionStatus}
        </Alert>
    </Snackbar>
}


// Feed component renders log feed
// it state is associated with the websocket
const Feed = () => {
    const [messageHistory, setMessageHistory] = useState<string[]>([])
    const [sockUrl, setSockUrl] = useState(defaultAddr)
    const [serial, setSerial] = useState("COM5")
    const disconnect = useRef(false)
    const oldReadyState = useRef(ReadyState.UNINSTANTIATED)
    // const { ready, message, ws, toggleOpen } = useContext(WebsocketContext)
    const { sendMessage, lastMessage, readyState } = useWebSocket(
        sockUrl,
        { shouldReconnect: (c: CloseEvent) => disconnect.current === false }
    )

    const shouldOpenSnackbar = oldReadyState.current !== readyState
    useEffect(() => { oldReadyState.current = readyState }, [readyState])

    const defaultRequest = (x: Partial<SocketRequest>) => {
        return JSON.stringify({
            method: 'read', timeout: 2 * secondInGolang,
            baudrate: 115200, serial: serial,
            ...x,
        })
    }

    // auto-discover connections on reconnects
    // try asap and later in intervals (in order to keep the
    // connection active too)
    useEffect(() => {
        if (SocketNotReady(readyState)) return
        sendMessage(defaultRequest({ method: 'discover' }))

        const id = setInterval(() => {
            sendMessage(defaultRequest({ method: 'discover' }))
        }, 10000)
        return () => clearInterval(id)
    }, [sockUrl, sendMessage, readyState])

    // bug: once connection is closed by server, client
    // does not recieve any context updates!
    const sendToSock = (x: Partial<SocketRequest>) => {
        if (SocketNotReady(readyState)) return console.warn('send failed: not ready yet', readyState)
        console.log("sends into socket")
        sendMessage(defaultRequest(x))
    }

    // bug: this effect is called but
    // actual messages do not get updated until snackbar disappears!
    useEffect(() => {
        setMessageHistory((old) => {
            if (!lastMessage) return old // skip null messages
            // also skip duplicate messages: this is a dirty hack
            // around react's strict mode to remove duplicate
            // entries in feed
            if (old.length > 0 && lastMessage.data === old.at(-1)) {
                console.warn('duplicate message', lastMessage)
                return old
            }
            console.log('updates messages', lastMessage, lastMessage.data)
            if (old.length == maxEntries) {
                old.shift()
            }
            return old.concat(lastMessage.data)
        })
        console.log('updated messages')
    }, [lastMessage, setMessageHistory])

    const handleConnect = useCallback(
        () => {
            if (disconnect.current) return console.log('omit disconnect')
            setSockUrl(defaultAddr)
        }, [disconnect]
    )
    const handleDiscover = useCallback(() => sendToSock({ method: 'discover' }), [sockUrl, sendToSock])

    return (
        <Card>
            <Redraws name='feed' />
            <AlertSnackbar open={readyState} />
            <Button onClick={handleConnect}>
                {!SocketNotReady(readyState) ? "Pause" : "Resume"}
            </Button>
            <Button
                onClick={handleDiscover}
                disabled={SocketNotReady(readyState)}
            >
                Discover connections
            </Button>
            <LogFeed messages={messageHistory} />
        </Card>
    )
}

export default Feed