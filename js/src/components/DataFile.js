import React from 'react';

class DataFile extends React.Component {
  constructor (props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(evt) {
    if (evt.target.files && evt.target.files[0]) {
      const file = evt.target.files[0];
      const reader = new FileReader();
      const onFileLoad = this.props.onFileLoad;
      reader.onload = e => onFileLoad(
        file.name, file.lastModifiedDate, e.target.result
      );
      reader.readAsText(evt.target.files[0]);
    }
  }

  render() {
    return <div>
      <p>Current File: {this.props.fileName} </p>
      <p>Loaded At: {this.props.fileDate} </p>
      <p>Load New File: <input type="file" onChange={this.handleChange}/></p>
    </div>;
  }
}

export default DataFile;
