import Button from '@mui/material/Button'
import React from 'react'
import { ReadyState } from 'react-use-websocket'
import { GlobalDispatcherContext, SocketNotReady } from '../contexts/WebSocket/WebSocketContext'

type Props = {
    readyState: ReadyState
}

const Controls = ({ readyState }: Props) => {
    const { discover } = React.useContext(GlobalDispatcherContext)

    // auto-discover connections on reconnects
    // try asap and later in intervals (in order to keep the
    // connection active too)
    React.useEffect(() => {
        if (SocketNotReady(readyState)) return
        discover()
        const id = setInterval(discover, 10000)
        return () => clearInterval(id)
    }, [discover, readyState])

    const handleDiscover = () => {
        if (SocketNotReady(readyState)) return console.warn('send failed: not ready yet', readyState)
        console.log("sends into socket")
        discover()
    }

    return (
        <React.Fragment>
            <Button
                onClick={handleDiscover}
                disabled={SocketNotReady(readyState)}
            >
                Refresh connections
            </Button>
        </React.Fragment>
    )
}

export default Controls