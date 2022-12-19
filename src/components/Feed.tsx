import { Button, Card, ListItem, ListItemText } from '@mui/material'
import { useEffect, useState } from 'react'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import useWebSocket from '../hooks/UseWebsocket'

type FeedProps = {
}

const renderRows = (p: ListChildComponentProps<string[]>) => {
    const { index, style, data } = p
    return (
        <ListItem style={style} key={index} component='div'>
            <ListItemText primary={data[index]} />
        </ListItem>
    )
}

const maxEntries = 10

// Feed component renders data passed 
const Feed = (props: Partial<FeedProps>) => {
    const [messages, setMessages] = useState<string[]>([])
    const consumer = (a: any) => {
        console.log(a);
        setMessages((oldState) => {
            if (oldState.length === maxEntries) {
                oldState.shift()
            }
            return [...oldState, a]
        })
    }
    const [isPaused, setPause, sendMessage] = useWebSocket({ consumer })
    useEffect(() => {
        console.log("will discover connections");
        setTimeout(() => {
            console.log("sends discover");
            sendMessage({ method: 'discover' })
        }, 1e4);
    }, [])



    return (
        <Card>
            <Button onClick={() => setPause(!isPaused)}>
                {isPaused ? "Resume" : "Pause"}
            </Button>
            <FixedSizeList
                width={500}
                height={500}
                itemData={messages}
                itemSize={46}
                itemCount={messages.length}
            >
                {renderRows}
            </FixedSizeList>
        </Card>
    )
}

export default Feed