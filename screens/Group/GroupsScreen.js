import React from 'react';
import { connect } from 'react-redux';
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Text,
  Image,
} from 'react-native';
import { Fab, Container } from 'native-base';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-easy-toast';
import { Row } from 'react-native-easy-grid';
import PropTypes from 'prop-types';
import { SearchBar } from 'react-native-elements';
import Colors from '../../constants/Colors';
import { getAll } from '../../store/actions/groups.actions';
import i18n from '../../languages';
import dtIcon from '../../assets/images/dt-icon.png';
import sharedTools from '../../shared';

const styles = StyleSheet.create({
  flatListItem: {
    height: 77,
    backgroundColor: 'white',
    margin: 20,
  },
  groupSubtitle: {
    flex: 1,
    flexWrap: 'wrap',
    paddingTop: 6,
    fontWeight: '200',
    color: 'rgba(0,0,0,0.6)',
  },
  errorText: {
    textAlign: 'center',
    height: 100,
    padding: 20,
    color: 'rgba(0,0,0,0.4)',
  },
  searchBarContainer: {
    borderBottomWidth: 1,
    backgroundColor: Colors.tabBar,
    borderTopColor: '#FFF',
    borderBottomColor: '#FFF',
    borderColor: '#F2F2F2',
    paddingBottom: 10,
    marginBottom: 1,
    elevation: 5,
  },
  searchBarInput: {
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: 'white',
    borderColor: '#DDDDDD',
    borderBottomWidth: 1,
    borderWidth: 1,
  },
  offlineBar: {
    height: 20,
    backgroundColor: '#FCAB10',
  },
  offlineBarText: {
    fontSize: 14,
    color: 'white',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  noGroupsContainer: {
    padding: 20,
    paddingTop: 50,
    textAlignVertical: 'top',
    textAlign: 'center',
  },
  noGroupsImage: {
    opacity: 0.5,
    height: 70,
    width: 70,
    padding: 10,
  },
  noGroupsText: {
    textAlignVertical: 'center',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#A8A8A8',
    padding: 5,
  },
  noGroupsTextOffilne: {
    textAlignVertical: 'center',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#A8A8A8',
    backgroundColor: '#fff2ac',
    padding: 5,
  },
  loadMoreFooterText: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#3f729b',
  },
});

let toastError,
  statusCircleSize = 15;

class GroupsScreen extends React.Component {
  state = {
    refresh: false,
    search: '',
    dataSourceGroups: this.props.groups,
    dataSourceGroupsFiltered: [],
    haveGroups: true,
    filtered: false,
    offset: 0,
    limit: 100,
    sort: '-last_modified',
  };

  componentDidUpdate(prevProps) {
    const { error } = this.props;
    if (prevProps.error !== error && error) {
      toastError.show(
        <View>
          <Text style={{ fontWeight: 'bold', color: Colors.errorText }}>
            {i18n.t('global.error.code')}
          </Text>
          <Text style={{ color: Colors.errorText }}>{error.code}</Text>
          <Text style={{ fontWeight: 'bold', color: Colors.errorText }}>
            {i18n.t('global.error.message')}
          </Text>
          <Text style={{ color: Colors.errorText }}>{error.message}</Text>
        </View>,
        3000,
      );
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { groups } = nextProps;
    let newState = {
      ...prevState,
      groups: groups || prevState.groups,
    };
    if (groups) {
      if (prevState.filtered) {
        newState = {
          ...prevState,
          dataSourceGroups: prevState.dataSourceGroupsFiltered,
          haveGroups: true,
          refresh: false,
        };
      } else {
        newState = {
          ...newState,
          dataSourceGroups: groups,
        };
      }
    }

    return newState;
  }

  renderFooter = () => {
    return (
      <View style={styles.loadMoreFooterText}>
        {this.props.isConnected && !this.state.filtered && (
          <TouchableOpacity
            onPress={() => {
              this.onRefresh(true);
            }}>
            <Text style={styles.loadMoreFooterText}>{i18n.t('notificationsScreen.loadMore')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  renderRow = (group) => (
    <TouchableOpacity
      onPress={() => this.goToGroupDetailScreen(group)}
      style={styles.flatListItem}
      key={group.ID}>
      <View style={{ flexDirection: 'row', height: '100%' }}>
        <View style={{ flexDirection: 'column', flexGrow: 1 }}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={{ flex: 1, flexWrap: 'wrap', fontWeight: 'bold' }}>{group.title}</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.groupSubtitle}>
              {this.props.groupSettings.fields.group_status.values[group.group_status]
                ? this.props.groupSettings.fields.group_status.values[group.group_status].label
                : ''}
              {this.props.groupSettings.fields.group_status.values[group.group_status] &&
              this.props.groupSettings.fields.group_type.values[group.group_type]
                ? ' • '
                : ''}
              {this.props.groupSettings.fields.group_type.values[group.group_type]
                ? this.props.groupSettings.fields.group_type.values[group.group_type].label
                : ''}
              {this.props.groupSettings.fields.group_type.values[group.group_type] &&
              group.member_count
                ? ' • '
                : ''}
              {group.member_count ? group.member_count : ''}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'column', width: statusCircleSize }}>
          <View
            style={{
              width: statusCircleSize,
              height: statusCircleSize,
              borderRadius: statusCircleSize / 2,
              backgroundColor: sharedTools.getSelectorColor(group.group_status),
              marginTop: 'auto',
              marginBottom: 'auto',
            }}></View>
        </View>
      </View>
    </TouchableOpacity>
  );

  flatListItemSeparator = () => (
    <View
      style={{
        height: 1,
        width: '100%',
        backgroundColor: '#dddddd',
      }}
    />
  );

  onRefresh = (pagination = false) => {
    if (pagination) {
      this.setState(
        (prevState) => ({
          offset: prevState.offset + prevState.limit,
          filtered: false,
          search: '',
        }),
        () => {
          this.props.getAllGroups(
            this.props.userData.domain,
            this.props.userData.token,
            this.state.offset,
            this.state.limit,
            this.state.sort,
          );
        },
      );
    } else {
      this.setState(
        () => ({
          offset: 0,
          filtered: false,
          search: '',
        }),
        () => {
          this.props.getAllGroups(
            this.props.userData.domain,
            this.props.userData.token,
            this.state.offset,
            this.state.limit,
            this.state.sort,
          );
        },
      );
    }
  };

  goToGroupDetailScreen = (groupData = null) => {
    if (groupData) {
      // Detail
      this.props.navigation.navigate('GroupDetail', {
        groupId: groupData.ID,
        onlyView: true,
        groupName: groupData.title,
        previousList: [],
        onGoBack: () => this.onRefresh(),
      });
    } else {
      // Create
      this.props.navigation.navigate('GroupDetail', {
        previousList: [],
        onlyView: true,
        onGoBack: () => this.onRefresh(),
      });
    }
  };

  renderHeader = () => {
    return (
      <View>
        <SearchBar
          placeholder={i18n.t('global.search')}
          onChangeText={(text) => this.SearchFilterFunction(text)}
          autoCorrect={false}
          value={this.state.search}
          containerStyle={styles.searchBarContainer}
          inputContainerStyle={styles.searchBarInput}
        />
        {!this.state.haveGroups && this.noGroupsRender()}
      </View>
    );
  };

  offlineBarRender = () => (
    <View style={[styles.offlineBar]}>
      <Text style={[styles.offlineBarText]}>{i18n.t('global.offline')}</Text>
    </View>
  );

  noGroupsRender = () => (
    <View style={styles.noGroupsContainer}>
      <Row style={{ justifyContent: 'center' }}>
        <Image style={styles.noGroupsImage} source={dtIcon} />
      </Row>
      <Text style={styles.noGroupsText}>{i18n.t('groupsScreen.noGroupPlacheHolder')}</Text>
      <Text style={styles.noGroupsText}>{i18n.t('groupsScreen.noGroupPlacheHolder1')}</Text>
      {!this.props.isConnected && (
        <Text style={styles.noGroupsTextOffilne}>
          {i18n.t('groupsScreen.noGroupPlacheHolderOffline')}
        </Text>
      )}
    </View>
  );

  SearchFilterFunction(text) {
    const itemsFiltered = [];
    this.props.groups.filter(function(item) {
      const textData = text
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const itemDataTitle = item.title
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const filterByTitle = itemDataTitle.includes(textData);
      if (filterByTitle === true) {
        itemsFiltered.push(item);
      }
      return itemsFiltered;
    });
    if (itemsFiltered.length > 0) {
      this.setState({
        refresh: true,
        dataSourceGroupsFiltered: itemsFiltered,
        filtered: true,
        search: text,
      });
    } else {
      this.setState({
        refresh: true,
        filtered: true,
        search: text,
      });
    }
  }

  static navigationOptions = {
    title: i18n.t('global.groups'),
    headerStyle: {
      backgroundColor: Colors.tintColor,
    },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  };

  render() {
    return (
      <Container>
        <View style={{ flex: 1 }}>
          {!this.props.isConnected && this.offlineBarRender()}
          <FlatList
            ListHeaderComponent={this.renderHeader}
            data={this.state.dataSourceGroups}
            extraData={this.state.refresh}
            renderItem={(item) => this.renderRow(item.item)}
            ItemSeparatorComponent={this.flatListItemSeparator}
            keyboardShouldPersistTaps="always"
            refreshControl={
              <RefreshControl refreshing={this.props.loading} onRefresh={this.onRefresh} />
            }
            ListFooterComponent={this.renderFooter}
            keyExtractor={(item) => item.ID.toString()}
          />
          <Fab
            style={{ backgroundColor: Colors.tintColor }}
            position="bottomRight"
            onPress={() => this.goToGroupDetailScreen()}>
            <Icon name="md-add" />
          </Fab>
          <Toast
            ref={(toast) => {
              toastError = toast;
            }}
            style={{ backgroundColor: Colors.errorBackground }}
            positionValue={210}
          />
        </View>
      </Container>
    );
  }
}

GroupsScreen.propTypes = {
  isConnected: PropTypes.bool,
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  userData: PropTypes.shape({
    domain: PropTypes.string,
    token: PropTypes.string,
  }).isRequired,
  getAllGroups: PropTypes.func.isRequired,
  /* eslint-disable */
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.number,
    }),
  ),
  /* eslint-enable */
  error: PropTypes.shape({
    code: PropTypes.any,
    message: PropTypes.string,
  }),
  loading: PropTypes.bool,
  groupSettings: PropTypes.shape({
    group_status: PropTypes.shape({
      values: PropTypes.shape({}),
    }),
    group_type: PropTypes.shape({
      values: PropTypes.shape({}),
    }),
    labelPlural: PropTypes.string,
  }),
};
GroupsScreen.defaultProps = {
  error: null,
  loading: false,
  groupSettings: null,
  isConnected: null,
};

const mapStateToProps = (state) => ({
  userData: state.userReducer.userData,
  groups: state.groupsReducer.groups,
  loading: state.groupsReducer.loading,
  error: state.groupsReducer.error,
  groupSettings: state.groupsReducer.settings,
  isConnected: state.networkConnectivityReducer.isConnected,
});
const mapDispatchToProps = (dispatch) => ({
  getAllGroups: (domain, token, offset, limit, sort) => {
    dispatch(getAll(domain, token, offset, limit, sort));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupsScreen);
