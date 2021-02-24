import React, { Component } from 'xreact'
import { classnames } from './util'
import TodoTextInput from './TodoTextInput'

export default class TodoItem extends Component {

  state = {
    editing: false
  }

  handleDoubleClick = () => {
    this.setState({ editing: true })
  }

  handleSave = (id, text) => {
    if (text.length === 0) {
      this.props.deleteTodo(id)
    } else {
      this.props.editTodo(id, text)
    }
    this.setState({ editing: false })
  }

  render() {
    const {todo, completeTodo, deleteTodo} = this.props

    let element
    if (this.state.editing) {
      element = (
        <TodoTextInput
          text={todo.text}
          editing={this.state.editing}
          onSave={(text) => this.handleSave(todo.id, text)}
        />
      )
    } else {
      element = (
        <div className="view">
          <input
            className="toggle"
            type="checkbox"
            checked={todo.completed}
            onInput={() => completeTodo(todo.id)}
          />
          <label onDoubleClick={this.handleDoubleClick}>{todo.text}</label>
          <button className="destroy" onClick={() => deleteTodo(todo.id)} />
        </div>
      )
    }

    return (
        <li dataKey={this.props.key} className={classnames({
        completed: todo.completed,
        editing: this.state.editing
      })}>
        {element}
      </li>
    )
  }
}
