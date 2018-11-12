module.exports = {
    shuffle: function (a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    },
    generateOrderLength: function (playerLength) {
        var orderList = new Array();
        for(var i=0; i < playerLength; i++) {
            orderList.push(i+1);
        }
        return orderList;
    }
}