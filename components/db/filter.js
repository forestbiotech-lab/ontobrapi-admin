module.exports = function (params,queryResults) {
    let result=pagination(params,queryResults)

    //TODO lookup attributes in callStructure if has a "." then search in objects attentation ofr arrays get first element
    //TODO sortBY
    //if it has a "." then search in objects

    return result
}


function pagination(params,queryResults) {
    let currentPage = parseInt(params.page) || 0
    queryResults.callStructure.metadata.pagination.currentPage = currentPage
    let pageSize = parseInt(params.pageSize) || 1000
    queryResults.callStructure.metadata.pagination.pageSize = pageSize
    return [{"$skip": (currentPage * pageSize)}, {"$limit": pageSize}]
}