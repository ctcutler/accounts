import React from 'react';

class DataFile extends React.Component {
  handleChange(evt) {
    // FIXME: instead of setting localStorage here we should fire trigger a
    // flux model change and set the file name and date via props
    if (evt.target.files && evt.target.files[0]) {
      const file = evt.target.files[0];
      const reader = new FileReader();
      reader.onload = e => localStorage.setItem('ledgerData', e.target.result);
      localStorage.setItem('ledgerFileName', file.name);
      localStorage.setItem('ledgerFileDate', file.lastModifiedDate);
      reader.readAsText(evt.target.files[0]);
    }
  }

  render() {
    return <div>
      <p>Current File: {localStorage.ledgerFileName} </p>
      <p>Loaded At: {localStorage.ledgerFileDate} </p>
      <p>Load New File: <input type="file" onChange={this.handleChange}/></p>
    </div>;
  }
}

export default DataFile;
