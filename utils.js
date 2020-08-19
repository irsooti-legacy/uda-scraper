const dashify = (str) => {
  return str
    .replace(/\W+(?!$)/g, '-')
    .toLowerCase()
    .replace(/\W$/, '')
    .toLowerCase();
};

module.exports = {
  dashify,
};
