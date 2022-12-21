import { Button, Card, ListItem, ListItemText, Typography } from '@mui/material'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import { WebsocketContext } from '../contexts/UseWebsocket'

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

// Feed component renders log feed
// it state is associated with the websocket
const Feed = () => {
    const [messages, setMessages] = useState<string[]>([])
    const [serial, setSerial] = useState("COM5")
    const { ready, message, ws, toggleOpen } = useContext(WebsocketContext)

    const defaultRequest = (x: Partial<SocketRequest>) => {
        return JSON.stringify({
            method: 'read', timeout: 2 * secondInGolang,
            baudrate: 115200, serial: serial,
            ...x,
        })
    }

    // bug: once connection is closed by server, client
    // does not recieve any context updates!
    const sendToSock = async (x: Partial<SocketRequest>) => {
        if (!ready) return console.warn('send failed: not ready yet')
        if (!ws) return console.warn('send failed: ws is null')
        if (ws.readyState == ws.OPEN) return ws.send(defaultRequest(x))
        console.error("failed to send into socket")
    }

    useEffect(() => {
        // auto-discover connections on first connect
        if (!ready) return
        console.log("will discover connections")
        sendToSock({ method: 'discover' })
    }, [ready])

    // bug: this effect is called but
    // actual messages do not get updated until snackbar disappears!
    useEffect(() => {
        setMessages((old) => {
            console.log('updates messages', message)
            if (!message) return old // skip null messages
            // also skip duplicate messages: this is a dirty hack
            // around react's strict mode to remove duplicate
            // entries in feed
            if (old.length > 0 && message === old.at(-1)) {
                console.warn('duplicate message', message)
                return old
            }
            if (old.length == maxEntries) {
                old.shift()
            }
            old.push(message)
            return old
        })
        console.log('updated messages')
    }, [message])

    return (
        <Card>
            <Redraws name='feed' />
            <Button onClick={toggleOpen}>
                {ready ? "Pause" : "Resume"}
            </Button>
            <Button
                onClick={async () => { sendToSock({ method: 'discover' }) }}
                disabled={!ready}
            >
                Discover connections
            </Button>
            <LogFeed messages={messages} />
        </Card>
    )
}

export default Feed