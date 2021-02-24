import React, { useState, useEffect, useCallback, useMemo } from 'xreact'
import ReactDOM from 'xreact-dom'

class Counter extends React.Component {
    state = {
        num: 0,
    }

    componentDidMount() {
        console.log('Counter did mount', this.state.num)
    }

    componentDidUpdate() {
        console.log('Counter did update', this.state.num)
    }

    componentWillUnmount() {
        console.log('Counter will unmount', this.state.num)
    }

    handleClick = () => {
        this.setState({
            num: this.state.num + 1,
        })
    }

    render() {
        return (
            <div>
              <div>{this.state.num}</div>
              <button onClick={this.handleClick}>add</button>
            </div>
        )
    }
}

const CounterHooks = () => {
    const [num, setNum] = useState(0)

    useEffect(() => {
        console.log('CounterHooks did mount', num)
        return () => {
            console.log('CounterHooks will unmount', num)
        }
    }, [])

    useEffect(() => {
        console.log('CounterHooks useEffect', num)
        return () => {
            console.log('CounterHooks useEffect cleanup', num)
        }
    }, [num])

    const handleClick = useCallback(() => {
        setNum(num + 1)
    }, [num])

    return (
        <div>
          <div>{num}</div>
          <button onClick={handleClick}>add</button>
        </div>
    )
}

const App = () => {
    return(
        <div>
          <section>
            <div>class component: </div>
            <Counter />
          </section>
          <section>
            <div>function component with hooks: </div>
            <CounterHooks />
          </section>
        </div>
    )
}

ReactDOM.render(
    <App />, document.getElementById('root')
)
